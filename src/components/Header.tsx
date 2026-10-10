import { NavLink } from 'react-router-dom';
import { LocateFixed, Loader2, Stethoscope, Building2 } from 'lucide-react';
import { useSession, useHospitals } from '../store/hospitals';
import { useNow } from '../hooks/useNow';
import { cn, timeAgo } from '../lib/util';

export function Header() {
  const { locate, locating, usingGps } = useSession();
  const latest = useHospitals((s) => Math.max(...s.hospitals.map((h) => h.updatedAt)));
  const now = useNow(5000);
  const link = ({ isActive }: { isActive: boolean }) =>
    cn('flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition', isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white');

  return (
    <header className="glass-solid sticky top-0 z-30 flex items-center gap-4 px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-brand shadow-[0_8px_24px_-6px_rgba(255,59,87,.8)]">
          <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path className="ecg-line" d="M3 17h6l3-7 5 13 3-6h8" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold">Emergency Triage</div>
          <div className="text-xs text-slate-400">Right hospital, not just the nearest</div>
        </div>
      </div>

      <nav className="ml-4 hidden gap-1 sm:flex">
        <NavLink to="/" end className={link}><Stethoscope size={16} />Triage console</NavLink>
        <NavLink to="/portal" className={link}><Building2 size={16} />Hospital portal</NavLink>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-white/6 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-inset ring-white/10 md:flex">
          <span className="ping h-2 w-2 rounded-full bg-ok" />
          Live data · updated {timeAgo(latest, now)}
        </div>
        <button onClick={locate} className="flex items-center gap-2 rounded-xl bg-white/6 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/10">
          {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} className={usingGps ? 'text-signal' : ''} />}
          <span className="hidden md:inline">{usingGps ? 'Using your location' : 'Use my location'}</span>
        </button>
      </div>
    </header>
  );
}
