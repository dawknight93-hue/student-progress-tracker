import { useState } from 'react';
import type { FormEvent } from 'react';
import { todayStr, uid } from '../lib/dates';
import type { Course, LogEntry, Rating } from '../types';
import { ModalShell } from './ui';

interface Props {
  course: Course;
  initialLesson: number;
  entry: LogEntry | null;
  onSave: (entry: LogEntry) => void;
  onClose: () => void;
}

const numOrNull = (v: string): number | null => (v.trim() === '' || Number.isNaN(Number(v)) ? null : Number(v));

export function LogModal({ course, initialLesson, entry, onSave, onClose }: Props) {
  const [date, setDate] = useState(entry?.date ?? todayStr());
  const [hours, setHours] = useState(entry?.hours != null ? String(entry.hours) : '');
  const [lessonNum, setLessonNum] = useState(String(entry?.lessonNum ?? initialLesson));
  const [complete, setComplete] = useState(entry ? entry.complete : true);
  const [rating, setRating] = useState<string>(String(entry?.rating ?? 3));
  const [score, setScore] = useState(entry?.score != null ? String(entry.score) : '');
  const [nextNote, setNextNote] = useState(entry?.nextNote ?? '');
  const [weak, setWeak] = useState(entry?.weak ?? '');
  const [homework, setHomework] = useState(entry?.homework ?? '');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      id: entry?.id ?? uid(),
      date,
      lessonNum: Number(lessonNum),
      complete,
      rating: Number(rating) as Rating,
      score: numOrNull(score),
      hours: numOrNull(hours),
      nextNote: nextNote.trim(),
      weak: weak.trim(),
      homework: homework.trim(),
    });
  };

  return (
    <ModalShell title={entry ? 'Edit lesson entry' : 'Log a lesson'} onClose={onClose}>
      <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="l-date">Date</label>
            <input id="l-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="l-hours">Length (hours)</label>
            <input id="l-hours" type="number" className="input" min={0} max={8} step={0.25} placeholder="1.0" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="l-lesson">Lesson</label>
          <select id="l-lesson" className="input" value={lessonNum} onChange={(e) => setLessonNum(e.target.value)}>
            {course.lessons.map((l) => (
              <option key={l.n} value={l.n}>
                {l.n}. {l.title}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="l-complete">How far did you get</label>
            <select id="l-complete" className="input" value={complete ? 'yes' : 'no'} onChange={(e) => setComplete(e.target.value === 'yes')}>
              <option value="yes">Finished the lesson</option>
              <option value="no">Partly covered</option>
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="l-rating">How well they know it</label>
            <select id="l-rating" className="input" value={rating} onChange={(e) => setRating(e.target.value)}>
              <option value="1">1 Shaky</option>
              <option value="2">2 Needs review</option>
              <option value="3">3 Proficient</option>
              <option value="4">4 Test-ready</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="l-score">Quiz or exam score (%)</label>
          <input id="l-score" type="number" className="input" min={0} max={100} step={1} placeholder="Leave blank if none" value={score} onChange={(e) => setScore(e.target.value)} />
          <span className="hint">A score under 80 puts the lesson back on the review list.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="l-next">Start next time by</label>
          <textarea id="l-next" className="input min-h-[84px] resize-y" maxLength={600} placeholder="Slide or topic where you stopped, what to recap first" value={nextNote} onChange={(e) => setNextNote(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="l-weak">Weak areas</label>
          <input id="l-weak" className="input" maxLength={200} placeholder="Topics that need another pass" value={weak} onChange={(e) => setWeak(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="l-home">Homework assigned</label>
          <input id="l-home" className="input" maxLength={200} placeholder="Reading, practice questions, chart work" value={homework} onChange={(e) => setHomework(e.target.value)} />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save lesson</button>
        </div>
      </form>
    </ModalShell>
  );
}
