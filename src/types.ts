export type CourseId = 'private' | 'instrument' | 'casel' | 'cmi' | 'camel';

export interface Lesson {
  n: number;
  title: string;
  kind: 'lesson' | 'exam';
  topics: string;
  standard: string;
  deck: string | null;
  /** The slide deck in Drive is very small, so it is probably not built yet. */
  draft: boolean;
  optional: boolean;
  note: string;
}

export interface Course {
  id: CourseId;
  name: string;
  short: string;
  lessons: Lesson[];
}

export type Rating = 1 | 2 | 3 | 4;

export interface LogEntry {
  id: string;
  date: string; // yyyy-mm-dd
  lessonNum: number;
  complete: boolean;
  rating: Rating;
  score: number | null;
  hours: number | null;
  nextNote: string;
  weak: string;
  homework: string;
}

export type TestStatus = 'none' | 'scheduled' | 'passed' | 'failed';

export interface KnowledgeTest {
  status: TestStatus;
  date: string;
  score: number | null;
}

export interface Student {
  id: string;
  name: string;
  courseId: CourseId;
  goal: string;
  startDate: string;
  testDate: string;
  status: 'active' | 'archived';
  logs: LogEntry[];
  knowledgeTest: KnowledgeTest;
  createdAt: string;
}

export type LessonState = 'none' | 'progress' | 'review' | 'done';
