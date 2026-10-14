import { useState } from 'react';
import type { FormEvent } from 'react';
import { COURSES, COURSE_ORDER } from '../curriculum';
import { todayStr } from '../lib/dates';
import type { CourseId, Student } from '../types';
import { ModalShell } from './ui';

export interface StudentFields {
  name: string;
  courseId: CourseId;
  goal: string;
  startDate: string;
  testDate: string;
}

interface Props {
  editing: Student | null;
  onSave: (fields: StudentFields) => void;
  onClose: () => void;
}

export function StudentModal({ editing, onSave, onClose }: Props) {
  const [name, setName] = useState(editing?.name ?? '');
  const [courseId, setCourseId] = useState<CourseId>(editing?.courseId ?? 'private');
  const [goal, setGoal] = useState(editing?.goal ?? '');
  const [startDate, setStartDate] = useState(editing?.startDate ?? todayStr());
  const [testDate, setTestDate] = useState(editing?.testDate ?? '');
  const locked = !!editing && editing.logs.length > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, courseId, goal: goal.trim(), startDate, testDate });
  };

  return (
    <ModalShell title={editing ? 'Edit student' : 'Add student'} onClose={onClose}>
      <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="s-name">Name</label>
          <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoFocus />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="s-course">Course</label>
          <select id="s-course" className="input" value={courseId} disabled={locked} onChange={(e) => setCourseId(e.target.value as CourseId)}>
            {COURSE_ORDER.map((k) => (
              <option key={k} value={k}>
                {COURSES[k].name} ({COURSES[k].lessons.length} lessons)
              </option>
            ))}
          </select>
          <span className="hint">
            {locked
              ? 'The course is locked once lessons are logged. To start the same student on another course, add them again with that course.'
              : 'Choose the course now. You cannot change it after the first lesson is logged.'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="s-goal">Goal</label>
          <input id="s-goal" className="input" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={120} placeholder="Pass the knowledge test, strengthen fundamentals, switch instructors" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="s-start">Start date</label>
            <input id="s-start" type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="label" htmlFor="s-test">Test or checkride date</label>
            <input id="s-test" type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save student</button>
        </div>
      </form>
    </ModalShell>
  );
}
