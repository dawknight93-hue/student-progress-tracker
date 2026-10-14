import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { RATING_LABEL } from '../curriculum';
import { ago, daysBetween, fmtDate, todayStr } from '../lib/dates';
import { summarize } from '../lib/progress';
import type { Lesson, LogEntry, Student, TestStatus } from '../types';
import { Pill, ProgressStrip, stateTone } from './ui';

interface Props {
  student: Student;
  recapDays: number;
  onBack: () => void;
  onEdit: () => void;
  onLog: (lessonNum: number | null, entry: LogEntry | null) => void;
  onUpdate: (patch: Partial<Student>) => void;
  onDelete: () => void;
  onDeleteLog: (logId: string) => void;
}

const STATE_LABEL = { none: 'Not started', progress: 'In progress', review: 'Needs review', done: 'Done' } as const;

export function StudentDetail({ student: s, recapDays, onBack, onEdit, onLog, onUpdate, onDelete, onDeleteLog }: Props) {
  const sum = summarize(s, recapDays);
  const [open, setOpen] = useState<number | null>(null);
  const [armed, setArmed] = useState<'delete' | 'log' | null>(null);
  const [armedLog, setArmedLog] = useState<string | null>(null);

  // A two-step confirm that expires, so a stray click never deletes anything.
  useEffect(() => {
    if (!armed && !armedLog) return;
    const t = window.setTimeout(() => {
      setArmed(null);
      setArmedLog(null);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [armed, armedLog]);

  const testDays = s.testDate ? daysBetween(todayStr(), s.testDate) : null;
  const history = [...sum.sorted].reverse();
  const last = sum.last;
  const lastLesson = last ? sum.course.lessons.find((l) => l.n === last.lessonNum) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button type="button" className="btn btn-sm" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" /> All students
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow">{sum.course.name}</div>
          <h2 className="break-words text-[40px] leading-none">{s.name}</h2>
          {s.goal && <p className="mt-1 text-muted">Goal: {s.goal}</p>}
          <p className="mt-1 text-[13px] text-muted">
            Started {fmtDate(s.startDate) || 'n/a'}
            {testDays !== null && ` · ${testDays >= 0 ? `Test in ${testDays} ${testDays === 1 ? 'day' : 'days'}` : 'Test date passed'} (${fmtDate(s.testDate)})`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={onEdit}>Edit</button>
          <button type="button" className="btn btn-primary" onClick={() => onLog(sum.next ? sum.next.n : null, null)}>
            Log a lesson
          </button>
        </div>
      </div>

      <section className="panel" aria-labelledby="left-off">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="left-off" className="text-2xl">Where we left off</h3>
          <div className="flex flex-wrap gap-1.5">
            {sum.stale && <Pill tone="warn">Recap first</Pill>}
            {sum.review.length > 0 && <Pill tone="warn">{sum.review.length} to review</Pill>}
          </div>
        </div>
        {last ? (
          <p className="text-muted">
            Last lesson was <b className="text-ink">{fmtDate(last.date)}</b> ({ago(sum.days ?? 0)}):{' '}
            <b className="text-ink">
              {last.lessonNum}. {lastLesson?.title ?? 'Lesson'}
            </b>{' '}
            ({last.complete ? 'finished' : 'partly covered'}, {RATING_LABEL[last.rating]}
            {last.score != null ? `, ${last.score}%` : ''}).
          </p>
        ) : (
          <p className="text-muted">No lessons logged yet.</p>
        )}
        {last?.nextNote && (
          <div className="rounded border border-line bg-surface2 p-3">
            <div className="eyebrow">Start next time by</div>
            <p className="whitespace-pre-wrap break-words">{last.nextNote}</p>
          </div>
        )}
        {last?.weak && (
          <p>
            <b>Weak areas:</b> <span className="break-words text-muted">{last.weak}</span>
          </p>
        )}
        {last?.homework && (
          <p>
            <b>Homework assigned:</b> <span className="break-words text-muted">{last.homework}</span>
          </p>
        )}
        <div className="border-t border-line pt-3">
          <div className="eyebrow">{sum.next ? (sum.resuming ? 'Pick up' : 'Next up') : 'Status'}</div>
          {sum.next ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="break-words text-xl font-semibold">
                Lesson {sum.next.n}: {sum.next.title}
              </span>
              <button type="button" className="btn btn-sm" onClick={() => onLog(sum.next!.n, null)}>
                Log this lesson
              </button>
            </div>
          ) : (
            <span className="text-xl font-semibold">Every required lesson is done.</span>
          )}
          {sum.next?.topics && <p className="mt-1 text-[13px] text-muted">{sum.next.topics}</p>}
        </div>
        {sum.review.length > 0 && (
          <div className="border-t border-line pt-3">
            <div className="eyebrow">Review first</div>
            <ul className="mt-1 flex flex-col gap-1">
              {sum.review.map((l) => {
                const e = sum.map[l.n].entry;
                return (
                  <li key={l.n} className="break-words">
                    <b>
                      {l.n}. {l.title}
                    </b>
                    <span className="text-muted">
                      {' '}
                      {e?.score != null ? `scored ${e.score}%` : e ? RATING_LABEL[e.rating] : ''}
                      {e?.weak ? `, weak: ${e.weak}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="progress-h">
        <h3 id="progress-h" className="text-2xl">Progress</h3>
        <ProgressStrip sum={sum} />
        <div className="font-mono text-[13px] text-muted">
          {sum.done} of {sum.req.length} required lessons done
        </div>
      </section>

      <section className="panel" aria-labelledby="kt-h">
        <h3 id="kt-h" className="text-2xl">Knowledge test</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="kt-status">Status</label>
            <select
              id="kt-status"
              className="input"
              value={s.knowledgeTest.status}
              onChange={(e) => onUpdate({ knowledgeTest: { ...s.knowledgeTest, status: e.target.value as TestStatus } })}
            >
              <option value="none">Not scheduled</option>
              <option value="scheduled">Scheduled</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="kt-date">Date</label>
            <input id="kt-date" type="date" className="input" value={s.knowledgeTest.date} onChange={(e) => onUpdate({ knowledgeTest: { ...s.knowledgeTest, date: e.target.value } })} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="kt-score">Score</label>
            <input
              id="kt-score"
              type="number"
              className="input"
              min={0}
              max={100}
              value={s.knowledgeTest.score ?? ''}
              onChange={(e) => onUpdate({ knowledgeTest: { ...s.knowledgeTest, score: e.target.value === '' ? null : Number(e.target.value) } })}
            />
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="all-h">
        <h3 id="all-h" className="text-2xl">All lessons</h3>
        <ul className="flex flex-col">
          {sum.course.lessons.map((l) => (
            <LessonRow
              key={l.n}
              lesson={l}
              state={sum.map[l.n].state}
              entry={sum.map[l.n].entry}
              isNext={sum.next?.n === l.n}
              open={open === l.n}
              onToggle={() => setOpen(open === l.n ? null : l.n)}
              onLog={() => onLog(l.n, null)}
            />
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="hist-h">
        <h3 id="hist-h" className="text-2xl">Session history</h3>
        {history.length === 0 && <p className="text-muted">Nothing logged yet.</p>}
        <ul className="flex flex-col gap-2">
          {history.map((e) => {
            const l = sum.course.lessons.find((x) => x.n === e.lessonNum);
            return (
              <li key={e.id} className="flex flex-col gap-1 rounded border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[13px] text-muted">
                      {fmtDate(e.date)}
                      {e.hours != null ? ` · ${e.hours} h` : ''}
                    </div>
                    <b className="break-words">
                      {e.lessonNum}. {l?.title ?? 'Lesson'}
                    </b>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone={e.complete ? 'ok' : 'accent'}>{e.complete ? 'Finished' : 'Partial'}</Pill>
                    <Pill>{RATING_LABEL[e.rating]}</Pill>
                    {e.score != null && <Pill tone={e.score >= 80 ? 'ok' : 'warn'}>{e.score}%</Pill>}
                  </div>
                </div>
                {e.nextNote && <p className="whitespace-pre-wrap break-words text-[13px] text-muted">Next: {e.nextNote}</p>}
                {e.weak && <p className="break-words text-[13px] text-muted">Weak: {e.weak}</p>}
                {e.homework && <p className="break-words text-[13px] text-muted">Homework: {e.homework}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" className="btn btn-sm" onClick={() => onLog(e.lessonNum, e)}>Edit</button>
                  <button
                    type="button"
                    className={`btn btn-sm ${armedLog === e.id ? 'btn-danger-armed' : 'btn-danger'}`}
                    onClick={() => {
                      if (armedLog === e.id) {
                        setArmedLog(null);
                        onDeleteLog(e.id);
                      } else {
                        setArmedLog(e.id);
                      }
                    }}
                  >
                    {armedLog === e.id ? 'Tap again to delete' : 'Delete'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel" aria-labelledby="mgmt-h">
        <h3 id="mgmt-h" className="text-2xl">Manage</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => onUpdate({ status: s.status === 'archived' ? 'active' : 'archived' })}>
            {s.status === 'archived' ? 'Restore to active' : 'Archive student'}
          </button>
          <button
            type="button"
            className={`btn ${armed === 'delete' ? 'btn-danger-armed' : 'btn-danger'}`}
            onClick={() => {
              if (armed === 'delete') onDelete();
              else setArmed('delete');
            }}
          >
            {armed === 'delete' ? 'Tap again to delete for good' : 'Delete student'}
          </button>
        </div>
        <p className="hint">Archiving hides a student from the board but keeps every lesson. Deleting removes them for good.</p>
      </section>
    </div>
  );
}

interface RowProps {
  lesson: Lesson;
  state: 'none' | 'progress' | 'review' | 'done';
  entry: LogEntry | null;
  isNext: boolean;
  open: boolean;
  onToggle: () => void;
  onLog: () => void;
}

function LessonRow({ lesson: l, state, entry, isNext, open, onToggle, onLog }: RowProps) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        className="flex w-full min-w-0 items-center justify-between gap-2 py-2.5 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="min-w-0 break-words">
          <span className="font-mono text-[13px] text-muted">{String(l.n).padStart(2, '0')}</span>{' '}
          <span className={isNext ? 'font-bold' : ''}>{l.title}</span>
          {l.optional && <span className="text-[13px] text-muted"> (optional)</span>}
        </span>
        <span className="flex flex-shrink-0 flex-wrap justify-end gap-1.5">
          {isNext && <Pill tone="accent">Next</Pill>}
          {l.draft && <Pill title="The slide deck in Drive is very small, so it may not be built yet.">Deck may be empty</Pill>}
          <Pill tone={stateTone(state)}>{STATE_LABEL[state]}</Pill>
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 pb-3 text-[13px]">
          {l.topics && (
            <p>
              <b>Topics:</b> <span className="text-muted">{l.topics}</span>
            </p>
          )}
          {l.standard && (
            <p>
              <b>Standard:</b> <span className="text-muted">{l.standard}</span>
            </p>
          )}
          {l.note && <p className="text-muted">{l.note}</p>}
          {entry && (
            <p className="text-muted">
              Last taught {fmtDate(entry.date)}, {RATING_LABEL[entry.rating]}
              {entry.score != null ? `, ${entry.score}%` : ''}.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {l.deck && (
              <a className="btn btn-sm" href={l.deck} target="_blank" rel="noreferrer">
                Open slides <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
            <button type="button" className="btn btn-sm" onClick={onLog}>Log this lesson</button>
          </div>
        </div>
      )}
    </li>
  );
}
