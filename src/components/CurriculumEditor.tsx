import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { COURSES, COURSE_ORDER } from '../curriculum';
import { useCurriculum } from '../lib/curriculum-context';
import type { CourseId, Lesson } from '../types';
import { ModalShell, Pill } from './ui';

interface Props {
  onBack: () => void;
  onToast: (msg: string) => void;
}

export function CurriculumEditor({ onBack, onToast }: Props) {
  const { courses, isEdited, saveOverride, resetLesson } = useCurriculum();
  const [courseId, setCourseId] = useState<CourseId>('private');
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [armedReset, setArmedReset] = useState<number | null>(null);

  useEffect(() => {
    if (!armedReset) return;
    const t = window.setTimeout(() => setArmedReset(null), 4000);
    return () => window.clearTimeout(t);
  }, [armedReset]);

  const course = courses[courseId];

  const handleSave = async (fields: {
    title: string;
    deck: string;
    topics: string;
    standard: string;
    note: string;
    draft: boolean;
    optional: boolean;
  }) => {
    if (!editing) return;
    const base = COURSES[courseId].lessons.find((l) => l.n === editing.n)!;
    const ov = {
      title: fields.title !== base.title ? fields.title : null,
      deck: fields.deck !== (base.deck ?? '') ? (fields.deck || null) : null,
      topics: fields.topics !== base.topics ? fields.topics : null,
      standard: fields.standard !== base.standard ? fields.standard : null,
      note: fields.note !== base.note ? fields.note : null,
      draft: fields.draft !== base.draft ? fields.draft : null,
      optional: fields.optional !== base.optional ? fields.optional : null,
    };
    const ok = await saveOverride(courseId, editing.n, ov);
    onToast(ok ? 'Lesson updated.' : 'Could not save. Please try again.');
    setEditing(null);
  };

  const handleReset = async (n: number) => {
    const ok = await resetLesson(courseId, n);
    onToast(ok ? 'Reset to default.' : 'Could not reset. Please try again.');
    setArmedReset(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button type="button" className="btn btn-sm" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" /> All students
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Curriculum</div>
          <h2 className="text-[40px] leading-none">Edit lessons</h2>
          <p className="mt-1 text-muted">
            Rename lessons and change slide deck links. Lesson numbers can't change — logged sessions reference them.
          </p>
        </div>
        <select
          className="input !w-auto"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value as CourseId)}
        >
          {COURSE_ORDER.map((k) => (
            <option key={k} value={k}>
              {COURSES[k].name} ({COURSES[k].lessons.length} lessons)
            </option>
          ))}
        </select>
      </div>

      <section className="panel">
        <ul className="flex flex-col">
          {course.lessons.map((l) => {
            const edited = isEdited(courseId, l.n);
            return (
              <li key={l.n} className="border-b border-line last:border-b-0 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[13px] text-muted">{String(l.n).padStart(2, '0')}</span>
                      <span className="font-semibold">{l.title}</span>
                      {edited && <Pill tone="accent">Edited</Pill>}
                      {l.draft && <Pill title="The slide deck in Drive is very small, so it may not be built yet.">Deck may be empty</Pill>}
                      {l.optional && <Pill>Optional</Pill>}
                    </div>
                    {l.deck && (
                      <a
                        className="mt-1 inline-flex items-center gap-1 text-[13px] text-accent hover:underline"
                        href={l.deck}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={12} aria-hidden="true" /> {l.deck.length > 60 ? l.deck.slice(0, 60) + '…' : l.deck}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-sm" onClick={() => setEditing(l)}>Edit</button>
                    {edited && (
                      <button
                        type="button"
                        className={`btn btn-sm ${armedReset === l.n ? 'btn-danger-armed' : 'btn-danger'}`}
                        onClick={() => {
                          if (armedReset === l.n) void handleReset(l.n);
                          else setArmedReset(l.n);
                        }}
                      >
                        {armedReset === l.n ? 'Tap again to reset' : 'Reset to default'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {editing && (
        <LessonEditModal
          lesson={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function LessonEditModal({
  lesson,
  onSave,
  onClose,
}: {
  lesson: Lesson;
  onSave: (fields: {
    title: string;
    deck: string;
    topics: string;
    standard: string;
    note: string;
    draft: boolean;
    optional: boolean;
  }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [deck, setDeck] = useState(lesson.deck ?? '');
  const [topics, setTopics] = useState(lesson.topics);
  const [standard, setStandard] = useState(lesson.standard);
  const [note, setNote] = useState(lesson.note);
  const [draft, setDraft] = useState(lesson.draft);
  const [optional, setOptional] = useState(lesson.optional);
  const [deckError, setDeckError] = useState('');

  const validateDeck = (val: string): boolean => {
    if (val.trim() === '') return true;
    try {
      const u = new URL(val.trim());
      return u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    if (!validateDeck(deck)) {
      setDeckError('Enter a valid https:// URL or leave blank.');
      return;
    }
    setDeckError('');
    onSave({
      title: trimmedTitle,
      deck: deck.trim(),
      topics: topics.trim(),
      standard: standard.trim(),
      note: note.trim(),
      draft,
      optional,
    });
  };

  return (
    <ModalShell title={`Edit Lesson ${lesson.n}`} onClose={onClose}>
      <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="le-title">Title</label>
          <input id="le-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required autoFocus />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="le-deck">Slide deck link</label>
          <input
            id="le-deck"
            className="input"
            value={deck}
            onChange={(e) => { setDeck(e.target.value); setDeckError(''); }}
            placeholder="https://docs.google.com/presentation/d/…"
            type="url"
          />
          {deckError && <span className="text-[12.5px] text-bad">{deckError}</span>}
          <span className="hint">Paste a full Google Slides URL or any https:// URL. Leave blank to clear.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="le-topics">Topics</label>
          <textarea id="le-topics" className="input min-h-[60px] resize-y" value={topics} onChange={(e) => setTopics(e.target.value)} maxLength={500} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="le-standard">Standard</label>
          <input id="le-standard" className="input" value={standard} onChange={(e) => setStandard(e.target.value)} maxLength={200} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="le-note">Note</label>
          <textarea id="le-note" className="input min-h-[60px] resize-y" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
            Draft (shows "Deck may be empty")
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} />
            Optional
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save lesson</button>
        </div>
      </form>
    </ModalShell>
  );
}
