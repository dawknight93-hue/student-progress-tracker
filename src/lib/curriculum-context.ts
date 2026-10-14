import { createContext, useContext } from 'react';
import type { Course, CourseId, Lesson } from '../types';

export interface LessonOverrideFields {
  title: string | null;
  deck: string | null;
  topics: string | null;
  standard: string | null;
  note: string | null;
  draft: boolean | null;
  optional: boolean | null;
}

export interface CurriculumContextValue {
  courses: Record<CourseId, Course>;
  loading: boolean;
  saveOverride: (courseId: CourseId, n: number, fields: LessonOverrideFields) => Promise<boolean>;
  resetLesson: (courseId: CourseId, n: number) => Promise<boolean>;
  isEdited: (courseId: CourseId, n: number) => boolean;
}

export const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function useCurriculum(): CurriculumContextValue {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error('useCurriculum must be used within CurriculumProvider');
  return ctx;
}

/** Apply a single override to a default lesson. Null fields keep the default. */
export function applyOverride(base: Lesson, ov: Partial<LessonOverrideFields>): Lesson {
  return {
    ...base,
    ...(ov.title != null ? { title: ov.title } : {}),
    ...(ov.deck != null ? { deck: ov.deck } : {}),
    ...(ov.topics != null ? { topics: ov.topics } : {}),
    ...(ov.standard != null ? { standard: ov.standard } : {}),
    ...(ov.note != null ? { note: ov.note } : {}),
    ...(ov.draft != null ? { draft: ov.draft } : {}),
    ...(ov.optional != null ? { optional: ov.optional } : {}),
  };
}
