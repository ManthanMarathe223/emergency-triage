import { useState, useRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../lib/util';
import type { Severity } from '../types';

export const SEVERITY: Record<Severity, { label: string; text: string; bg: string; ring: string; hex: string }> = {
  critical: { label: 'Critical', text: 'text-brand-soft', bg: 'bg-brand/15', ring: 'ring-brand/50', hex: '#ff3b57' },
  high: { label: 'High priority', text: 'text-orange-300', bg: 'bg-orange-400/15', ring: 'ring-orange-400/40', hex: '#fb923c' },
  moderate: { label: 'Moderate', text: 'text-warn', bg: 'bg-warn/15', ring: 'ring-warn/40', hex: '#fbbf24' },
  low: { label: 'Low priority', text: 'text-ok', bg: 'bg-ok/15', ring: 'ring-ok/40', hex: '#34d399' },
};

/** React Bits - Spotlight Glow Card (cursor-following radial glow) */
export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(34, 211, 238, 0.15)',
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        'glass relative overflow-hidden rounded-3xl p-5 transition-all duration-300',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** React Bits - Shimmer Button with animated border light */
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
        'group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50',
        className,
      )}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-signal/0 via-signal/40 to-signal/0 opacity-0 transition-opacity group-hover:opacity-100 animate-pulse" />
      <span className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}

/** Shadcn Style Badge */
export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'signal';
  className?: string;
}) {
  const styles = {
    default: 'bg-white/10 text-white ring-white/20',
    secondary: 'bg-slate-800 text-slate-300 ring-slate-700',
    outline: 'bg-transparent text-slate-300 ring-white/15',
    destructive: 'bg-brand/15 text-brand-soft ring-brand/30',
    success: 'bg-ok/15 text-ok ring-ok/30',
    signal: 'bg-signal/15 text-signal ring-signal/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset backdrop-blur-sm',
        styles[variant],
        className,
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
    neutral: 'bg-white/6 text-slate-300 ring-white/10',
    ok: 'bg-ok/12 text-ok ring-ok/30',
    bad: 'bg-brand/12 text-brand-soft ring-brand/30',
    signal: 'bg-signal/12 text-signal ring-signal/30',
    warn: 'bg-warn/12 text-warn ring-warn/30',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>
      {children}
    </span>
  );
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
