const pad = (n: number): string => (n < 10 ? '0' : '') + n;

/** Today as yyyy-mm-dd in the viewer's local time. */
export function todayStr(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from a to b (both yyyy-mm-dd). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}

export function daysAgoStr(back: number, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
  return todayStr(d);
}

export function fmtDate(s: string): string {
  if (!s) return '';
  return parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ago(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
