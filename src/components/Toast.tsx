import { useEffect } from 'react';

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3500);
    return () => window.clearTimeout(t);
  }, [message, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-40 max-w-[90vw] -translate-x-1/2 rounded border border-line bg-ink px-4 py-2.5 text-sm font-medium text-bg shadow-lg"
    >
      {message}
    </div>
  );
}
