import type { ReactNode } from 'react';
import type { LessonState } from '../types';
import type { Summary } from '../lib/progress';

export type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'accent';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-surface2 text-muted',
  ok: 'bg-okBg text-ok',
  warn: 'bg-warnBg text-warn',
  bad: 'bg-badBg text-bad',
  accent: 'bg-accent text-accentInk',
};

export function Pill({ tone = 'neutral', title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold tracking-[0.02em] ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

export function stateTone(state: LessonState): Tone {
  return state === 'done' ? 'ok' : state === 'review' ? 'warn' : state === 'progress' ? 'accent' : 'neutral';
}

const segClass: Record<LessonState, string> = {
  none: 'bg-surface2 border-line',
  done: 'bg-ok border-ok',
  review: 'bg-warnBg border-warn',
  progress: 'bg-accent border-accent',
};

/** One block per required lesson, colored by state. The next lesson is outlined. */
export function ProgressStrip({ sum }: { sum: Summary }) {
  const nextN = sum.next ? sum.next.n : -1;
  return (
    <div className="flex flex-wrap gap-[3px]" aria-hidden="true">
      {sum.req.map((l) => (
        <span
          key={l.n}
          title={`${l.n}. ${l.title}`}
          className={`h-2.5 w-3.5 rounded-sm border ${segClass[sum.map[l.n].state]} ${l.n === nextN ? 'border-2 !border-ink' : ''}`}
        />
      ))}
    </div>
  );
}

export function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="flex w-full max-w-[560px] flex-col gap-3.5 rounded-lg border border-line bg-surface p-5">
        <h2 className="text-[28px] leading-none">{title}</h2>
        {children}
      </div>
    </div>
  );
}
