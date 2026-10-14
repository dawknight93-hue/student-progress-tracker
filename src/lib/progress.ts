import { COURSES } from '../curriculum.ts';
import { daysBetween, todayStr } from './dates.ts';
import type { Course, Lesson, LessonState, LogEntry, Student } from '../types.ts';

export interface LessonStatus {
  state: LessonState;
  entry: LogEntry | null;
}

export interface Summary {
  course: Course;
  map: Record<number, LessonStatus>;
  /** Lessons that count toward progress (optional lessons are left out). */
  req: Lesson[];
  done: number;
  review: Lesson[];
  next: Lesson | null;
  resuming: boolean;
  last: LogEntry | null;
  days: number | null;
  stale: boolean;
  /** Entries oldest to newest. */
  sorted: LogEntry[];
}

/** Oldest to newest. Entries on the same date keep the order they were saved. */
export function sortLogs(logs: LogEntry[]): LogEntry[] {
  return logs
    .map((l, i) => ({ l, i }))
    .sort((a, b) => (a.l.date < b.l.date ? -1 : a.l.date > b.l.date ? 1 : a.i - b.i))
    .map((x) => x.l);
}

/** The state of one lesson comes from its most recent entry. */
export function stateOf(e: LogEntry | undefined | null): LessonState {
  if (!e) return 'none';
  if (!e.complete) return 'progress';
  if (e.score != null) return e.score >= 80 ? 'done' : 'review';
  return e.rating >= 3 ? 'done' : 'review';
}

export function summarize(
  student: Pick<Student, 'courseId' | 'logs'>,
  recapDays: number,
  today: string = todayStr()
): Summary {
  const course = COURSES[student.courseId];
  const sorted = sortLogs(student.logs);
  const latest = new Map<number, LogEntry>();
  sorted.forEach((l) => latest.set(l.lessonNum, l));

  const map: Record<number, LessonStatus> = {};
  course.lessons.forEach((ls) => {
    const entry = latest.get(ls.n) ?? null;
    map[ls.n] = { state: stateOf(entry), entry };
  });

  const req = course.lessons.filter((l) => !l.optional);
  const done = req.filter((l) => map[l.n].state === 'done').length;
  const review = course.lessons.filter((l) => map[l.n].state === 'review');
  const resume = req.find((l) => map[l.n].state === 'progress') ?? null;
  const fresh = req.find((l) => map[l.n].state === 'none') ?? null;
  const next = resume ?? fresh;
  const last = sorted.length ? sorted[sorted.length - 1] : null;
  const days = last ? daysBetween(last.date, today) : null;

  return {
    course,
    map,
    req,
    done,
    review,
    next,
    resuming: resume !== null,
    last,
    days,
    stale: days !== null && days >= recapDays && next !== null,
    sorted,
  };
}
