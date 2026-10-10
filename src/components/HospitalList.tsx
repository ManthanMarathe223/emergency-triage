import { useDeferredValue, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Phone, Search, SearchX, AlertTriangle, X } from 'lucide-react';
import type { FacilityKey, RankedHospital } from '../types';
import { FACILITY_LABEL, capability, loadLabel } from '../lib/capability';
import { cn } from '../lib/util';
import { Meter, Pill } from './ui';

const FILTERS: FacilityKey[] = ['icu', 'trauma', 'cardiac', 'neuro', 'burn'];
type Sort = 'best' | 'nearest' | 'load';

interface Props {
  ranked: RankedHospital[];
  required: FacilityKey[];
  triageActive: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function HospitalList({ ranked, required, triageActive, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FacilityKey[]>([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('best');
  const q = useDeferredValue(query.trim().toLowerCase());

  const rows = useMemo(() => {
    const list = ranked.filter((r) => {
      const h = r.hospital;
      if (openOnly && h.status === 'diverting') return false;
      if (filters.some((f) => !capability(h, f).ok)) return false;
      if (!q) return true;
      const hay = [h.name, h.area, ...h.doctors.map((d) => `${d.name} ${d.specialty}`), ...FILTERS.filter((f) => capability(h, f).ok).map((f) => FACILITY_LABEL[f])].join(' ').toLowerCase();
      return q.split(/\s+/).every((t) => hay.includes(t));
    });
    if (sort === 'nearest') return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === 'load') return [...list].sort((a, b) => a.hospital.loadPct - b.hospital.loadPct);
    return list;
  }, [ranked, q, filters, openOnly, sort]);

  const toggle = (f: FacilityKey) => setFilters((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  return (
    <section className="glass flex h-full min-h-[400px] flex-col overflow-hidden rounded-2xl border border-app bg-surface" aria-label="Hospitals List">
      <div className="space-y-3 border-b border-app p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-bold text-primary">Hospital Capability Directory</h2>
            <Pill tone="neutral">{rows.length} of {ranked.length}</Pill>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort hospitals"
            className="rounded-lg border border-app bg-surface-elevated px-2.5 py-1 text-xs font-semibold text-primary outline-none cursor-pointer">
            <option value="best">{triageActive ? 'Best clinical match' : 'Default ranking'}</option>
            <option value="nearest">Nearest first</option>
            <option value="load">Lowest load</option>
          </select>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by hospital, district, specialist or facility..."
            className="w-full rounded-xl border border-app bg-surface-elevated py-2 pl-9 pr-9 text-xs text-primary outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-muted" aria-label="Search hospitals" />
          {query && <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary cursor-pointer"><X size={14} /></button>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => toggle(f)} aria-pressed={filters.includes(f)}
              className={cn('rounded-lg px-2.5 py-1 text-xs font-medium border transition cursor-pointer', filters.includes(f) ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700' : 'bg-surface-elevated text-secondary border-app hover:bg-surface-muted')}>
              {FACILITY_LABEL[f]}
            </button>
          ))}
          <button onClick={() => setOpenOnly((v) => !v)} aria-pressed={openOnly}
            className={cn('rounded-lg px-2.5 py-1 text-xs font-medium border transition cursor-pointer', openOnly ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700' : 'bg-surface-elevated text-secondary border-app hover:bg-surface-muted')}>
            Accepting patients
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3.5 bg-app">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((r) => (
            <HospitalCard key={r.hospital.id} r={r} required={required} triageActive={triageActive} isBest={triageActive && ranked[0]?.hospital.id === r.hospital.id && r.suitable}
              open={selectedId === r.hospital.id} onToggle={() => onSelect(selectedId === r.hospital.id ? null : r.hospital.id)} />
          ))}
        </AnimatePresence>
        {rows.length === 0 && (
          <div className="grid place-items-center gap-2 py-10 text-center text-xs text-secondary">
            <SearchX size={26} className="text-muted" />
            <div>No medical facilities match the current criteria.</div>
            <button className="text-blue-600 dark:text-blue-400 underline cursor-pointer" onClick={() => { setQuery(''); setFilters([]); setOpenOnly(false); }}>Reset search and filters</button>
          </div>
        )}
      </div>
    </section>
  );
}

function HospitalCard({ r, required, triageActive, isBest, open, onToggle }: { r: RankedHospital; required: FacilityKey[]; triageActive: boolean; isBest: boolean; open: boolean; onToggle: () => void }) {
  const h = r.hospital;
  const onDuty = h.doctors.filter((d) => d.onDuty);
  const statusTone = h.status === 'open' ? 'ok' : h.status === 'busy' ? 'warn' : 'bad';
  const shown: FacilityKey[] = triageActive ? required : FILTERS.filter((f) => capability(h, f).ok);

  return (
    <motion.article layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className={cn('rounded-xl border transition-all', isBest ? 'bg-blue-50/70 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800' : open ? 'bg-surface border-blue-400 dark:border-blue-700' : 'bg-surface border-app hover:border-strong')}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 p-3.5 text-left cursor-pointer">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-bold text-primary">{h.name}</h3>
            {isBest && <Pill tone="signal">Recommended</Pill>}
            <Pill tone={statusTone}>{h.status === 'open' ? 'Accepting' : h.status === 'busy' ? 'Busy' : 'Diverting'}</Pill>
          </div>
          <div className="mt-0.5 text-xs text-secondary">{h.area} · {onDuty.length} specialists on duty</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {shown.map((f) => {
              const c = capability(h, f);
              return <Pill key={f} tone={triageActive ? (c.ok ? 'ok' : 'bad') : 'neutral'}>{triageActive && (c.ok ? <Check size={11} /> : <X size={11} />)}{FACILITY_LABEL[f]}</Pill>;
            })}
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <Meter value={h.loadPct} className="max-w-36" />
            <span className="text-xs text-secondary">{loadLabel(h.loadPct)} load ({h.loadPct}%)</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-xl font-bold text-primary leading-none">{r.etaMin}<span className="ml-0.5 text-xs font-medium text-secondary">m</span></div>
          <div className="mt-1 text-xs text-secondary">{r.distanceKm.toFixed(1)} km</div>
          <ChevronDown size={15} className={cn('ml-auto mt-2 text-muted transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-app p-3.5 bg-surface-elevated">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {([['General Beds', h.beds], ['ICU Beds', h.icu], ['Ventilators', h.ventilators], ['ER Bays', h.erBays]] as const).map(([label, v]) => (
                  <div key={label} className="rounded-lg border border-app bg-surface p-2.5">
                    <div className="text-xs text-secondary">{label}</div>
                    <div className={cn('font-display text-base font-bold text-primary', v.available === 0 && 'text-red-600 dark:text-red-400')}>{v.available}<span className="text-xs font-normal text-muted"> / {v.total}</span></div>
                  </div>
                ))}
              </div>
              {r.missing.length > 0 && (
                <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800/60 p-2.5 text-xs text-amber-800 dark:text-amber-300">
                  {r.missing.map((m) => <div key={m.key} className="flex items-center gap-1.5"><AlertTriangle size={13} />{m.detail}</div>)}
                </div>
              )}
              <div>
                <div className="mb-1 text-xs font-semibold text-secondary">Duty Roster</div>
                <div className="flex flex-wrap gap-1">
                  {onDuty.length ? onDuty.map((d) => <Pill key={d.id}>{d.name} ({d.specialty})</Pill>) : <span className="text-xs text-muted">No specialists currently listed on duty</span>}
                </div>
              </div>
              <a href={`tel:${h.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-lg border border-app bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-muted"><Phone size={13} /> {h.phone}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
