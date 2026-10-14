import { useCallback, useEffect, useRef, useState } from 'react';
import { COURSES } from '../curriculum';
import { daysAgoStr, todayStr, uid } from '../lib/dates';
import type { Student } from '../types';

const KEY = 'student-progress-tracker:v1';

interface ReadResult {
  students: Student[];
  ok: boolean;
}

function readStore(): ReadResult {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
    if (!raw) return { students: [], ok: true };
    const parsed = JSON.parse(raw) as { students?: Student[] };
    return { students: Array.isArray(parsed.students) ? parsed.students : [], ok: true };
  } catch (err) {
    console.error('Could not read saved students', err);
    // Keep a copy of anything unreadable so it is never silently overwritten.
    try {
      if (raw) localStorage.setItem(KEY + ':unreadable', raw);
    } catch {
      /* ignore */
    }
    return { students: [], ok: false };
  }
}

function writeStore(students: Student[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, students }));
    return true;
  } catch (err) {
    console.error('Could not save students', err);
    return false;
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

export function useStudents() {
  const [initial] = useState<ReadResult>(readStore);
  const [students, setStudents] = useState<Student[]>(initial.students);
  const [storageOk, setStorageOk] = useState<boolean>(initial.ok);
  const latest = useRef<Student[]>(students);
  const changed = useRef(false);

  useEffect(() => {
    latest.current = students;
    if (!changed.current) return; // do not write back what we just read
    setStorageOk(writeStore(students));
  }, [students]);

  // Flush on the way out so a closed tab never loses the last edit.
  useEffect(() => {
    const flush = () => {
      if (changed.current) writeStore(latest.current);
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  const mutate = useCallback((fn: (prev: Student[]) => Student[]) => {
    changed.current = true;
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

  /** Merges by student id: matching students are replaced, new ones are added. */
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

  return { students, storageOk, addStudent, updateStudent, deleteStudent, addExample, exportJson, importJson };
}
