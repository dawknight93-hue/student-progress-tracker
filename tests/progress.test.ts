import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, stateOf } from '../src/lib/progress.ts';
import { COURSES } from '../src/curriculum.ts';
import type { LogEntry } from '../src/types.ts';

let id = 0;
const log = (o: Partial<LogEntry> & { lessonNum: number; date: string }): LogEntry => ({
  id: String(++id),
  complete: true,
  rating: 3,
  score: null,
  hours: 1,
  nextNote: '',
  weak: '',
  homework: '',
  ...o,
});

test('new student starts at lesson 1', () => {
  const s = summarize({ courseId: 'private', logs: [] }, 14, '2026-10-13');
  assert.equal(s.next?.n, 1);
  assert.equal(s.resuming, false);
  assert.equal(s.days, null);
  assert.equal(s.stale, false);
});

test('finished lesson moves next to the following lesson', () => {
  const s = summarize({ courseId: 'private', logs: [log({ lessonNum: 1, date: '2026-10-01' })] }, 14, '2026-10-13');
  assert.equal(s.next?.n, 2);
  assert.equal(s.done, 1);
});

test('partly covered lesson is resumed, not skipped', () => {
  const s = summarize({ courseId: 'private', logs: [log({ lessonNum: 1, date: '2026-10-01' }), log({ lessonNum: 2, date: '2026-10-05', complete: false })] }, 14, '2026-10-13');
  assert.equal(s.next?.n, 2);
  assert.equal(s.resuming, true);
});

test('score under 80 means review and does not count as done', () => {
  const s = summarize({ courseId: 'private', logs: [log({ lessonNum: 1, date: '2026-10-01', score: 72 })] }, 14, '2026-10-13');
  assert.equal(s.map[1].state, 'review');
  assert.deepEqual(s.review.map((l) => l.n), [1]);
  assert.equal(s.done, 0);
  assert.equal(s.next?.n, 2);
});

test('score of exactly 80 is done; score overrides rating', () => {
  assert.equal(stateOf(log({ lessonNum: 1, date: '2026-10-01', score: 80, rating: 1 })), 'done');
  assert.equal(stateOf(log({ lessonNum: 1, date: '2026-10-01', score: 79, rating: 4 })), 'review');
});

test('without a score, rating 2 is review and rating 3 is done', () => {
  assert.equal(stateOf(log({ lessonNum: 1, date: '2026-10-01', rating: 2 })), 'review');
  assert.equal(stateOf(log({ lessonNum: 1, date: '2026-10-01', rating: 3 })), 'done');
});

test('a later entry replaces an earlier one for the same lesson', () => {
  const s = summarize({ courseId: 'private', logs: [log({ lessonNum: 1, date: '2026-10-01', score: 60 }), log({ lessonNum: 1, date: '2026-10-08', score: 90 })] }, 14, '2026-10-13');
  assert.equal(s.map[1].state, 'done');
  assert.equal(s.review.length, 0);
});

test('optional lessons are skipped for next-up and progress counts', () => {
  const course = COURSES.camel;
  const optional = course.lessons.filter((l) => l.optional).map((l) => l.n);
  assert.ok(optional.length > 0);
  const logs = course.lessons.filter((l) => !l.optional).map((l, i) => log({ lessonNum: l.n, date: `2026-09-${String(i + 1).padStart(2, '0')}` }));
  const s = summarize({ courseId: 'camel', logs }, 14, '2026-10-13');
  assert.equal(s.next, null);
  assert.equal(s.done, s.req.length);
  assert.ok(s.req.every((l) => !optional.includes(l.n)));
});

test('recap flag appears at the threshold and only when a lesson remains', () => {
  const logs = [log({ lessonNum: 1, date: '2026-09-29' })];
  assert.equal(summarize({ courseId: 'private', logs }, 14, '2026-10-12').stale, false); // 13 days
  assert.equal(summarize({ courseId: 'private', logs }, 14, '2026-10-13').stale, true); // 14 days
  assert.equal(summarize({ courseId: 'private', logs }, 30, '2026-10-13').stale, false);
});

test('every course has unique, ascending lesson numbers', () => {
  for (const c of Object.values(COURSES)) {
    const ns = c.lessons.map((l) => l.n);
    assert.equal(new Set(ns).size, ns.length, c.id);
    assert.deepEqual(ns, [...ns].sort((a, b) => a - b), c.id);
  }
});
