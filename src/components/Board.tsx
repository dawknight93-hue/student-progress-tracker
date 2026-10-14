import { useMemo } from 'react';
import { ago, daysBetween, fmtDate, todayStr } from '../lib/dates';
import { summarize } from '../lib/progress';
import type { Summary } from '../lib/progress';
import type { Course, CourseId, Student } from '../types';
import { Pill, ProgressStrip } from './ui';

export type SortKey = 'attention' | 'recent' | 'name';

interface Props {
  students: Student[];
  recapDays: number;
  sortBy: SortKey;
  showArchived: boolean;
  courses: Record<CourseId, Course>;
  onSort: (k: SortKey) => void;
  onShowArchived: (v: boolean) => void;
  onOpen: (id: string) => void;
  onAdd: () => void;
  onExample: () => void;
}

export function Board({ students, recapDays, sortBy, showArchived, courses, onSort, onShowArchived, onOpen, onAdd, onExample }: Props) {
  const archivedCount = students.filter((s) => s.status === 'archived').length;

  const rows = useMemo(() => {
    const list = students
      .filter((s) => showArchived || s.status !== 'archived')
      .map((s) => ({ s, sum: summarize(s, recapDays, todayStr(), courses) }));
    list.sort((a, b) => {
      if (sortBy === 'name') return a.s.name.localeCompare(b.s.name);
      if (sortBy === 'recent') return (b.sum.last?.date ?? '').localeCompare(a.sum.last?.date ?? '');
      const da = a.sum.days ?? 9999;
      const db = b.sum.days ?? 9999;
      return db - da || a.s.name.localeCompare(b.s.name);
    });
    return list;
  }, [students, recapDays, sortBy, showArchived, courses]);

  if (!students.length) {
    return (
      <section className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line bg-surface px-5 py-8">
        <h2 className="text-[28px]">No students yet</h2>
        <p className="max-w-[60ch] text-muted">
          Add a student, pick their course, and log each lesson as you teach it. The tracker shows the next lesson, what to review, and how long it has been, so you can pick up where you stopped even after a few weeks off.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={onAdd}>Add your first student</button>
          <button type="button" className="btn" onClick={onExample}>Try it with an example student</button>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="eyebrow">
          {rows.length} {rows.length === 1 ? 'student' : 'students'}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
          <label className="flex items-center gap-2" htmlFor="sort-by">
            Sort by
            <select id="sort-by" className="input !w-auto" value={sortBy} onChange={(e) => onSort(e.target.value as SortKey)}>
              <option value="attention">Longest since last lesson</option>
              <option value="recent">Most recent lesson</option>
              <option value="name">Name</option>
            </select>
          </label>
          {archivedCount > 0 && (
            <label className="flex items-center gap-2" htmlFor="show-arch">
              <input id="show-arch" type="checkbox" checked={showArchived} onChange={(e) => onShowArchived(e.target.checked)} />
              Show archived ({archivedCount})
            </label>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4">
        {rows.map(({ s, sum }) => (
          <StudentCard key={s.id} student={s} sum={sum} onOpen={() => onOpen(s.id)} />
        ))}
      </div>
    </>
  );
}

function StudentCard({ student: s, sum, onOpen }: { student: Student; sum: Summary; onOpen: () => void }) {
  const nextTxt = sum.next ? `${sum.resuming ? 'Resume ' : ''}Lesson ${sum.next.n}: ${sum.next.title}` : 'Course complete';
  const lastTxt = sum.last ? `Last lesson ${fmtDate(sum.last.date)} (${ago(sum.days ?? 0)})` : 'No lessons logged yet';
  const testDays = s.testDate ? daysBetween(todayStr(), s.testDate) : null;
  const note = sum.last?.nextNote ?? '';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full min-w-0 cursor-pointer flex-col gap-3 rounded-md border border-line bg-surface p-4 text-left hover:border-accent"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{sum.course.short}</div>
          <h3 className="break-words text-2xl leading-[1.1]">{s.name}</h3>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {s.status === 'archived' && <Pill>Archived</Pill>}
          {sum.stale && <Pill tone="warn">Recap</Pill>}
          {sum.review.length > 0 && <Pill tone="warn">{sum.review.length} to review</Pill>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <ProgressStrip sum={sum} />
        <div className="font-mono text-[13px] text-muted">
          {sum.done} of {sum.req.length} lessons done
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {sum.next ? (sum.resuming ? 'Pick up' : 'Next up') : 'Status'}
        </span>
        <span className="break-words font-semibold">{nextTxt}</span>
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] text-muted">
        <span>{lastTxt}</span>
        {testDays !== null && (
          <span>
            {testDays >= 0 ? `Test in ${testDays} ${testDays === 1 ? 'day' : 'days'}` : 'Test date passed'} ({fmtDate(s.testDate)})
          </span>
        )}
      </div>
      {note && (
        <div className="break-words border-t border-line pt-2.5 text-[13px] text-muted">
          <b className="font-semibold text-ink">Start next time by:</b> {note.length > 140 ? note.slice(0, 140) + '…' : note}
        </div>
      )}
    </button>
  );
}
