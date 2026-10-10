import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/util';
import type { Severity } from '../types';

export const SEVERITY: Record<
  Severity,
  { label: string; level: string; text: string; bg: string; border: string; badge: string; hex: string }
> = {
  critical: {
    label: 'Critical Priority',
    level: 'Level 1 · Immediate',
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800/60',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-300 dark:border-red-700',
    hex: '#dc2626',
  },
  high: {
    label: 'High Priority',
    level: 'Level 2 · Urgent',
    text: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800/60',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    hex: '#ea580c',
  },
  moderate: {
    label: 'Moderate Priority',
    level: 'Level 3 · Semi-Urgent',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/60',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    hex: '#d97706',
  },
  low: {
    label: 'Low Priority',
    level: 'Level 4 · Non-Urgent',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    hex: '#16a34a',
  },
};

/** Standard Container Surface */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-surface border-app p-5 shadow-xs transition-colors',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Primary Action Button */
export function ShimmerButton({
  children,
  className,
  onClick,
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
    >
      {children}
    </button>
  );
}

/** Status Badge */
export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'signal' | 'warn';
  className?: string;
}) {
  const styles = {
    default: 'bg-surface-elevated text-primary border-app',
    secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-transparent',
    outline: 'bg-transparent text-secondary border-app',
    destructive: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    signal: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
    warn: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ok' | 'bad' | 'signal' | 'warn';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-surface-elevated text-secondary border-app',
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    bad: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
    signal: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
    warn: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Meter({ value, className }: { value: number; className?: string }) {
  const color = value >= 80 ? 'bg-red-600 dark:bg-red-500' : value >= 55 ? 'bg-amber-600 dark:bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-500';
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Button({ className, variant = 'ghost', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }) {
  const v = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs focus-visible:outline-blue-600',
    ghost: 'bg-surface-elevated text-primary hover:bg-surface-muted border border-app',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60 dark:hover:bg-red-900/60',
    outline: 'bg-transparent text-primary hover:bg-surface-elevated border border-app',
  }[variant];
  return <button {...p} className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer', v, className)} />;
}

export function Stepper({ value, max, min = 0, onChange, label }: { value: number; max: number; min?: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-app bg-surface-elevated">
      <button aria-label={`Decrease ${label}`} className="grid h-8 w-8 place-items-center rounded-l-lg hover:bg-surface-muted disabled:opacity-30 text-primary" disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={14} /></button>
      <span className="min-w-10 text-center text-xs font-semibold tabular-nums text-primary">{value}</span>
      <button aria-label={`Increase ${label}`} className="grid h-8 w-8 place-items-center rounded-r-lg hover:bg-surface-muted disabled:opacity-30 text-primary" disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={14} /></button>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer', on ? 'bg-blue-600' : 'bg-surface-muted border border-app')}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; tone: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl bg-surface-elevated p-1 border border-app">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn('rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer', value === o.value ? 'bg-surface text-primary shadow-xs font-semibold' : 'text-secondary hover:text-primary')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
