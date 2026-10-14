import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { COURSES } from '../curriculum';
import { supabase } from './supabase';
import type { Course, CourseId, Lesson } from '../types';
import {
  CurriculumContext,
  applyOverride,
  type CurriculumContextValue,
  type LessonOverrideFields,
} from './curriculum-context';

interface OverrideRow {
  course_id: string;
  lesson_n: number;
  title: string | null;
  deck: string | null;
  topics: string | null;
  standard: string | null;
  note: string | null;
  draft: boolean | null;
  optional: boolean | null;
}

interface OverrideMap {
  [courseId: string]: { [lessonN: number]: Partial<LessonOverrideFields> };
}

function mergeCourses(overrides: OverrideMap): Record<CourseId, Course> {
  const result = {} as Record<CourseId, Course>;
  for (const cid of Object.keys(COURSES) as CourseId[]) {
    const base = COURSES[cid];
    const courseOv = overrides[cid];
    const lessons = base.lessons.map((l) => {
      const ov = courseOv?.[l.n];
      return ov ? applyOverride(l, ov) : l;
    });
    result[cid] = { ...base, lessons };
  }
  return result;
}

function isLessonEdited(base: Lesson, ov: Partial<LessonOverrideFields> | undefined): boolean {
  if (!ov) return false;
  if (ov.title != null && ov.title !== base.title) return true;
  if (ov.deck != null && ov.deck !== base.deck) return true;
  if (ov.topics != null && ov.topics !== base.topics) return true;
  if (ov.standard != null && ov.standard !== base.standard) return true;
  if (ov.note != null && ov.note !== base.note) return true;
  if (ov.draft != null && ov.draft !== base.draft) return true;
  if (ov.optional != null && ov.optional !== base.optional) return true;
  return false;
}

export function CurriculumProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);
  const overridesRef = useRef<OverrideMap>({});
  const reloadInFlight = useRef(false);

  useEffect(() => { overridesRef.current = overrides; }, [overrides]);

  const loadOverrides = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('lesson_overrides')
      .select('course_id,lesson_n,title,deck,topics,standard,note,draft,optional')
      .eq('user_id', uid);
    if (error) return;
    const map: OverrideMap = {};
    for (const r of data as OverrideRow[]) {
      if (!map[r.course_id]) map[r.course_id] = {};
      map[r.course_id][r.lesson_n] = {
        title: r.title,
        deck: r.deck,
        topics: r.topics,
        standard: r.standard,
        note: r.note,
        draft: r.draft,
        optional: r.optional,
      };
    }
    setOverrides(map);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await loadOverrides(userId);
      if (cancelled) return;
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId, loadOverrides]);

  const reload = useCallback(async () => {
    if (reloadInFlight.current) return;
    reloadInFlight.current = true;
    await loadOverrides(userId);
    reloadInFlight.current = false;
  }, [userId, loadOverrides]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    const onFocus = () => void reload();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [reload]);

  const saveOverride = useCallback(async (
    courseId: CourseId,
    n: number,
    fields: LessonOverrideFields,
  ): Promise<boolean> => {
    const row = {
      user_id: userId,
      course_id: courseId,
      lesson_n: n,
      ...fields,
    };
    const { error } = await supabase
      .from('lesson_overrides')
      .upsert(row, { onConflict: 'user_id,course_id,lesson_n' });
    if (error) return false;
    // Update local state immediately
    setOverrides((prev) => {
      const next = { ...prev };
      if (!next[courseId]) next[courseId] = {};
      next[courseId] = { ...next[courseId], [n]: { ...fields } };
      return next;
    });
    return true;
  }, [userId]);

  const resetLesson = useCallback(async (
    courseId: CourseId,
    n: number,
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('lesson_overrides')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('lesson_n', n);
    if (error) return false;
    setOverrides((prev) => {
      const next = { ...prev };
      if (next[courseId]) {
        next[courseId] = { ...next[courseId] };
        delete next[courseId][n];
        if (Object.keys(next[courseId]).length === 0) delete next[courseId];
      }
      return next;
    });
    return true;
  }, [userId]);

  const isEdited = useCallback((courseId: CourseId, n: number): boolean => {
    const ov = overridesRef.current[courseId]?.[n];
    if (!ov) return false;
    return isLessonEdited(COURSES[courseId].lessons.find((l) => l.n === n)!, ov);
  }, []);

  const courses = mergeCourses(overrides);

  const value: CurriculumContextValue = {
    courses,
    loading,
    saveOverride,
    resetLesson,
    isEdited,
  };

  return (
    <CurriculumContext.Provider value={value}>
      {children}
    </CurriculumContext.Provider>
  );
}

// Re-export for convenience
export type { Session };
