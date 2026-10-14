import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import { Board } from './components/Board';
import type { SortKey } from './components/Board';
import { LogModal } from './components/LogModal';
import { StudentDetail } from './components/StudentDetail';
import { StudentModal } from './components/StudentModal';
import type { StudentFields } from './components/StudentModal';
import { Toast } from './components/Toast';
import { COURSES } from './curriculum';
import { useStudents } from './hooks/useStudents';
import { todayStr } from './lib/dates';
import { summarize } from './lib/progress';
import type { LogEntry } from './types';

const RECAP_KEY = 'student-progress-tracker:recap-days';

function readRecap(): number {
  try {
    const n = Number(localStorage.getItem(RECAP_KEY));
    return Number.isFinite(n) && n >= 1 && n <= 365 ? Math.round(n) : 14;
  } catch {
    return 14;
  }
}

type Modal =
  | { kind: 'student'; editId: string | null }
  | { kind: 'log'; lessonNum: number; entry: LogEntry | null }
  | null;

export default function App() {
  const store = useStudents();
  const { students } = store;
  const [openId, setOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('attention');
  const [showArchived, setShowArchived] = useState(false);
  const [recapDays, setRecapDays] = useState<number>(readRecap);
  const fileRef = useRef<HTMLInputElement>(null);
  const clearToast = useCallback(() => setToast(''), []);

  useEffect(() => {
    try {
      localStorage.setItem(RECAP_KEY, String(recapDays));
    } catch {
      /* ignore */
    }
  }, [recapDays]);

  const open = openId ? students.find((s) => s.id === openId) ?? null : null;
  // If the open student disappears (deleted, imported over), fall back to the board.
  useEffect(() => {
    if (openId && !open) setOpenId(null);
  }, [openId, open]);

  const saveStudent = (fields: StudentFields) => {
    if (modal?.kind !== 'student') return;
    if (modal.editId) {
      store.updateStudent(modal.editId, fields);
      setToast('Student updated.');
    } else {
      const id = store.addStudent(fields);
      setOpenId(id);
      setToast(`${fields.name} added.`);
    }
    setModal(null);
  };

  const saveLog = (entry: LogEntry) => {
    if (!open) return;
    const exists = open.logs.some((l) => l.id === entry.id);
    const logs = exists ? open.logs.map((l) => (l.id === entry.id ? entry : l)) : [...open.logs, entry];
    store.updateStudent(open.id, { logs });
    const after = summarize({ courseId: open.courseId, logs }, recapDays);
    setToast(after.next ? `Saved. Next up: Lesson ${after.next.n}.` : 'Saved. Course complete.');
    setModal(null);
  };

  const doExport = () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-tracker-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const r = store.importJson(await file.text());
      setToast(`Imported: ${r.added} added, ${r.replaced} replaced.`);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'That file could not be read.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const editing = modal?.kind === 'student' && modal.editId ? students.find((s) => s.id === modal.editId) ?? null : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col gap-5 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Ground school</div>
          <h1 className="text-[44px] leading-none">Student Progress Tracker</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[13px] text-muted" htmlFor="recap-days">
            Recap after
            <input
              id="recap-days"
              type="number"
              className="input !w-[72px]"
              min={1}
              max={365}
              value={recapDays}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value));
                if (Number.isFinite(n) && n >= 1 && n <= 365) setRecapDays(n);
              }}
            />
            days
          </label>
          <button type="button" className="btn" onClick={doExport} disabled={!students.length}>
            <Download size={15} aria-hidden="true" /> Export
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={15} aria-hidden="true" /> Import
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void doImport(e.target.files?.[0])} />
          <button type="button" className="btn btn-primary" onClick={() => setModal({ kind: 'student', editId: null })}>
            <Plus size={15} aria-hidden="true" /> Add student
          </button>
        </div>
      </header>

      {!store.storageOk && (
        <div role="alert" className="rounded border border-warn bg-warnBg px-3 py-2 text-warn">
          This browser is not saving data (private window or blocked storage). Use Export to keep a copy before you close the tab.
        </div>
      )}

      <main className="flex flex-col gap-4">
        {open ? (
          <StudentDetail
            student={open}
            recapDays={recapDays}
            onBack={() => setOpenId(null)}
            onEdit={() => setModal({ kind: 'student', editId: open.id })}
            onLog={(n, entry) => setModal({ kind: 'log', lessonNum: n ?? COURSES[open.courseId].lessons[0].n, entry })}
            onUpdate={(patch) => store.updateStudent(open.id, patch)}
            onDelete={() => {
              store.deleteStudent(open.id);
              setOpenId(null);
              setToast('Student deleted.');
            }}
            onDeleteLog={(logId) => {
              store.updateStudent(open.id, { logs: open.logs.filter((l) => l.id !== logId) });
              setToast('Entry deleted.');
            }}
          />
        ) : (
          <Board
            students={students}
            recapDays={recapDays}
            sortBy={sortBy}
            showArchived={showArchived}
            onSort={setSortBy}
            onShowArchived={setShowArchived}
            onOpen={setOpenId}
            onAdd={() => setModal({ kind: 'student', editId: null })}
            onExample={() => setOpenId(store.addExample())}
          />
        )}
      </main>

      <footer className="mt-auto pt-4 text-[12.5px] text-muted">
        Data is saved in this browser only. Use Export to back it up or move it to another device.
      </footer>

      {modal?.kind === 'student' && <StudentModal editing={editing} onSave={saveStudent} onClose={() => setModal(null)} />}
      {modal?.kind === 'log' && open && (
        <LogModal course={COURSES[open.courseId]} initialLesson={modal.lessonNum} entry={modal.entry} onSave={saveLog} onClose={() => setModal(null)} />
      )}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}
