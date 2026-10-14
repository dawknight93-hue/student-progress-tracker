import { useCallback, useEffect, useRef, useState } from 'react';
import { COURSES } from '../curriculum';
import { daysAgoStr, todayStr, uid } from '../lib/dates';
import { supabase } from '../lib/supabase';
import type { Student } from '../types';

const OLD_KEY = 'student-progress-tracker:v1';
const MIGRATED_KEY = 'student-progress-tracker:v1:migrated';

interface MigrationData {
  students: Student[];
  dismissed: boolean;
}

function readMigration(): MigrationData {
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return { students: [], dismissed: false };
    const parsed = JSON.parse(raw) as { students?: Student[] };
    const students = Array.isArray(parsed.students) ? parsed.students : [];
    return { students, dismissed: false };
  } catch {
    return { students: [], dismissed: false };
  }
}

function isStudent(x: unknown): x is Student {
  if (!x || typeof x !== 'object') return false;
  const s = x as Partial<Student>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.courseId === 'string' &&
    s.courseId in COURSES &&
    Array.isArray(s.logs)
  );
}

export interface NewStudent {
  name: string;
  courseId: Student['courseId'];
  goal: string;
  startDate: string;
  testDate: string;
}

export function useStudents(userId: string | null) {
  const [students, setStudents] = useState<Student[]>([]);
  const [storageOk, setStorageOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const latest = useRef<Student[]>([]);
  const skipSave = useRef(false);

  // Ref of the students array as it was after the last successful load or save.
  // Used to diff local changes so we only upsert students whose reference actually
  // changed, and only delete ids we knew about and are now missing.
  const lastSynced = useRef<Student[]>([]);

  // Serialize saves so two never run concurrently.
  const saveRunning = useRef(false);
  const saveQueued = useRef(false);

  useEffect(() => { latest.current = students; }, [students]);

  // Load from Supabase when user changes
  useEffect(() => {
    if (!userId) { setStudents([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('students')
        .select('data')
        .eq('user_id', userId);
      if (cancelled) return;
      if (error) {
        setStorageOk(false);
        setLoading(false);
        return;
      }
      const loaded = (data ?? [])
        .map((r) => r.data as unknown)
        .filter(isStudent);
      skipSave.current = true;
      lastSynced.current = loaded;
      setStudents(loaded);
      setStorageOk(true);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Save to Supabase on every student change
  useEffect(() => {
    if (!userId) return;
    if (skipSave.current) {
      skipSave.current = false;
      lastSynced.current = latest.current;
      return;
    }
    void requestSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, userId]);

  const runSave = useCallback(async () => {
    if (!userId) return;
    const current = latest.current;
    const synced = lastSynced.current;

    // Diff by reference: only upsert students that are new or changed.
    const syncedMap = new Map(synced.map((s) => [s.id, s]));
    const toUpsert = current.filter((s) => syncedMap.get(s.id) !== s);

    // Only delete ids that were in the last-synced set and are now missing locally.
    // Never query remote for deletes — that would clobber other devices' additions.
    const currentIds = new Set(current.map((s) => s.id));
    const toDeleteIds = synced
      .filter((s) => !currentIds.has(s.id))
      .map((s) => s.id);

    if (toUpsert.length > 0) {
      const rows = toUpsert.map((s) => ({
        user_id: userId,
        id: s.id,
        data: s as unknown as Record<string, unknown>,
      }));
      const { error: upErr } = await supabase
        .from('students')
        .upsert(rows, { onConflict: 'user_id,id' });
      if (upErr) { setStorageOk(false); return; }
    }

    if (toDeleteIds.length > 0) {
      const { error: delErr } = await supabase
        .from('students')
        .delete()
        .in('id', toDeleteIds)
        .eq('user_id', userId);
      if (delErr) { setStorageOk(false); return; }
    }

    lastSynced.current = current;
    setStorageOk(true);
  }, [userId]);

  const requestSave = useCallback(async () => {
    if (saveRunning.current) {
      saveQueued.current = true;
      return;
    }
    saveRunning.current = true;
    await runSave();
    saveRunning.current = false;
    while (saveQueued.current) {
      saveQueued.current = false;
      saveRunning.current = true;
      await runSave();
      saveRunning.current = false;
    }
  }, [runSave]);

  const reload = useCallback(async () => {
    if (!userId) return;
    if (saveRunning.current || saveQueued.current) return;
    const { data, error } = await supabase
      .from('students')
      .select('data')
      .eq('user_id', userId);
    if (error) return;
    // A save may have started during the fetch; abort if so.
    if (saveRunning.current || saveQueued.current) return;
    const loaded = (data ?? [])
      .map((r) => r.data as unknown)
      .filter(isStudent);
    skipSave.current = true;
    lastSynced.current = loaded;
    setStudents(loaded);
  }, [userId]);

  // Reload when the tab becomes visible or focused, so other devices' changes appear.
  useEffect(() => {
    if (!userId) return;
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
  }, [userId, reload]);

  const mutate = useCallback((fn: (prev: Student[]) => Student[]) => {
    setStudents(fn);
  }, []);

  const addStudent = useCallback(
    (data: NewStudent): string => {
      const id = uid();
      const student: Student = {
        id,
        ...data,
        status: 'active',
        logs: [],
        knowledgeTest: { status: 'none', date: '', score: null },
        createdAt: todayStr(),
      };
      mutate((prev) => [...prev, student]);
      return id;
    },
    [mutate]
  );

  const updateStudent = useCallback(
    (id: string, patch: Partial<Student>) => {
      mutate((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [mutate]
  );

  const deleteStudent = useCallback(
    (id: string) => {
      mutate((prev) => prev.filter((s) => s.id !== id));
    },
    [mutate]
  );

  const addExample = useCallback((): string => {
    const id = uid();
    const example: Student = {
      id,
      name: 'Example Student (delete me)',
      courseId: 'private',
      goal: 'Example only: pass the private knowledge test',
      startDate: daysAgoStr(60),
      testDate: '',
      status: 'active',
      createdAt: todayStr(),
      knowledgeTest: { status: 'none', date: '', score: null },
      logs: [
        { id: uid() + 'a', date: daysAgoStr(45), lessonNum: 1, complete: true, rating: 3, score: null, hours: 1, nextNote: 'Start Lesson 2 at the electrical system slide.', weak: '', homework: 'Read the systems chapter' },
        { id: uid() + 'b', date: daysAgoStr(31), lessonNum: 2, complete: true, rating: 2, score: 72, hours: 1.5, nextNote: 'Recap the fuel system first, then Lesson 3.', weak: 'Fuel and electrical systems', homework: 'Redo systems quiz' },
        { id: uid() + 'c', date: daysAgoStr(19), lessonNum: 3, complete: false, rating: 3, score: null, hours: 1, nextNote: 'Stopped at stalls and spins. Resume there.', weak: '', homework: '' },
      ],
    };
    mutate((prev) => [...prev, example]);
    return id;
  }, [mutate]);

  const exportJson = useCallback((): string => {
    return JSON.stringify({ app: 'student-progress-tracker', version: 1, exportedAt: todayStr(), students: latest.current }, null, 2);
  }, []);

  const importJson = useCallback(
    (text: string): { added: number; replaced: number } => {
      const parsed = JSON.parse(text) as { students?: unknown[] };
      const incoming = (parsed.students ?? []).filter(isStudent);
      if (!incoming.length) throw new Error('No students found in that file.');
      const known = new Set(latest.current.map((p) => p.id));
      const replaced = incoming.filter((s) => known.has(s.id)).length;
      const added = incoming.length - replaced;
      mutate((prev) => {
        const next = [...prev];
        incoming.forEach((s) => {
          const i = next.findIndex((p) => p.id === s.id);
          if (i >= 0) next[i] = s;
          else next.push(s);
        });
        return next;
      });
      return { added, replaced };
    },
    [mutate]
  );

  const migration = useRef<MigrationData>({ students: [], dismissed: false });
  const [migrationVisible, setMigrationVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    try {
      if (localStorage.getItem(MIGRATED_KEY)) return;
    } catch { return; }
    const m = readMigration();
    if (m.students.length > 0) {
      migration.current = m;
      setMigrationVisible(true);
    }
  }, [userId]);

  const uploadMigration = useCallback(async () => {
    const m = migration.current;
    if (!userId || m.students.length === 0) return;
    const rows = m.students.map((s) => ({
      user_id: userId,
      id: s.id,
      data: s as unknown as Record<string, unknown>,
    }));
    const { error } = await supabase
      .from('students')
      .upsert(rows, { onConflict: 'user_id,id' });
    if (error) { setStorageOk(false); return; }
    // Merge into local state and update lastSynced so the save effect
    // doesn't re-upsert them.
    skipSave.current = true;
    setStudents((prev) => {
      const next = [...prev];
      m.students.forEach((s) => {
        const i = next.findIndex((p) => p.id === s.id);
        if (i >= 0) next[i] = s;
        else next.push(s);
      });
      lastSynced.current = next;
      return next;
    });
    try { localStorage.setItem(MIGRATED_KEY, '1'); } catch { /* ignore */ }
    setMigrationVisible(false);
  }, [userId]);

  const dismissMigration = useCallback(() => {
    setMigrationVisible(false);
  }, []);

  return {
    students,
    storageOk,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    addExample,
    exportJson,
    importJson,
    migrationVisible,
    migrationCount: migration.current.students.length,
    uploadMigration,
    dismissMigration,
  };
}
