export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');
export const uid = () => Math.random().toString(36).slice(2, 10);
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}
