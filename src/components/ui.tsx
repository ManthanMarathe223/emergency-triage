import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/util';
import type { Severity } from '../types';

export const SEVERITY: Record<Severity, { label: string; text: string; bg: string; ring: string; hex: string }> = {
  critical: { label: 'Critical', text: 'text-brand-soft', bg: 'bg-brand/15', ring: 'ring-brand/50', hex: '#ff3b57' },
  high: { label: 'High priority', text: 'text-orange-300', bg: 'bg-orange-400/15', ring: 'ring-orange-400/40', hex: '#fb923c' },
  moderate: { label: 'Moderate', text: 'text-warn', bg: 'bg-warn/15', ring: 'ring-warn/40', hex: '#fbbf24' },
  low: { label: 'Low priority', text: 'text-ok', bg: 'bg-ok/15', ring: 'ring-ok/40', hex: '#34d399' },
};

export function Pill({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'bad' | 'signal' | 'warn'; className?: string }) {
  const tones = {
    neutral: 'bg-white/6 text-slate-300 ring-white/10',
    ok: 'bg-ok/12 text-ok ring-ok/30',
    bad: 'bg-brand/12 text-brand-soft ring-brand/30',
    signal: 'bg-signal/12 text-signal ring-signal/30',
    warn: 'bg-warn/12 text-warn ring-warn/30',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>{children}</span>;
}

export function Meter({ value, className }: { value: number; className?: string }) {
  const color = value >= 80 ? 'bg-brand' : value >= 55 ? 'bg-warn' : 'bg-ok';
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/8', className)} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Button({ className, variant = 'ghost', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const v = {
    primary: 'bg-brand text-white hover:bg-brand/90 shadow-[0_8px_28px_-8px_rgba(255,59,87,.7)]',
    ghost: 'bg-white/6 text-slate-200 hover:bg-white/10 ring-1 ring-inset ring-white/10',
    danger: 'bg-brand/12 text-brand-soft hover:bg-brand/20 ring-1 ring-inset ring-brand/30',
  }[variant];
  return <button {...p} className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:pointer-events-none', v, className)} />;
}

export function Stepper({ value, max, min = 0, onChange, label }: { value: number; max: number; min?: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-xl bg-white/6 ring-1 ring-inset ring-white/10">
      <button aria-label={`Decrease ${label}`} className="grid h-9 w-9 place-items-center rounded-l-xl hover:bg-white/10 disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={15} /></button>
      <span className="min-w-12 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button aria-label={`Increase ${label}`} className="grid h-9 w-9 place-items-center rounded-r-xl hover:bg-white/10 disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={15} /></button>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-ok' : 'bg-white/15')}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; tone: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl bg-white/6 p-1 ring-1 ring-inset ring-white/10">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn('rounded-lg px-3.5 py-1.5 text-sm font-semibold transition', value === o.value ? o.tone : 'text-slate-400 hover:text-slate-200')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
