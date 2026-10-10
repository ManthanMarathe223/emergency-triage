import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BedDouble,
  CheckCircle2,
  Droplets,
  HeartPulse,
  Plus,
  RotateCcw,
  Search,
  Siren,
  Trash2,
  UserRound,
  Wind,
  XCircle,
  Zap,
  ShieldCheck,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import type { Capability, Doctor, Hospital, HospitalStatus, Resource, Room, RoomStatus, RoomType, Specialty } from '../types';
import { ALL_FACILITIES, FACILITY_LABEL, SPECIALIST, capability, loadLabel } from '../lib/capability';
import { clamp, cn, timeAgo, uid } from '../lib/util';
import { useNow } from '../hooks/useNow';
import { useHospitals } from '../store/hospitals';
import { useAuth } from '../store/auth';
import { Button, Meter, Pill, Segmented, Stepper, Toggle } from '../components/ui';

const SPECIALTIES: Specialty[] = ['Emergency Physician', 'Intensivist', 'Cardiologist', 'Neurologist', 'Trauma Surgeon', 'Burn Specialist', 'Pulmonologist', 'General Surgeon'];
const ROOM_TYPES: RoomType[] = ['ICU', 'OT', 'ER', 'Ward'];
const NEXT: Record<RoomStatus, RoomStatus> = { available: 'occupied', occupied: 'cleaning', cleaning: 'available' };
const ROOM_STYLE: Record<RoomStatus, string> = {
  available: 'bg-ok/15 text-ok ring-ok/40',
  occupied: 'bg-brand/15 text-brand-soft ring-brand/40',
  cleaning: 'bg-warn/15 text-warn ring-warn/40',
};
type ResKey = 'beds' | 'icu' | 'ventilators' | 'erBays';

export function PortalPage() {
  const hospitals = useHospitals((s) => s.hospitals);
  const activity = useHospitals((s) => s.activity);
  const update = useHospitals((s) => s.update);
  const simulateRush = useHospitals((s) => s.simulateRush);
  const reset = useHospitals((s) => s.reset);
  const { currentAccount, quickLogin } = useAuth();
  const now = useNow(5000);

  // If user is logged in as a specific hospital, default to that hospital
  const initialId = currentAccount?.hospitalId && hospitals.some((x) => x.id === currentAccount.hospitalId)
    ? currentAccount.hospitalId
    : hospitals[0]?.id;

  const [id, setId] = useState(initialId);
  const [q, setQ] = useState('');

  // Keep synced if currentAccount changes
  useEffect(() => {
    if (currentAccount?.hospitalId && hospitals.some((x) => x.id === currentAccount.hospitalId)) {
      setId(currentAccount.hospitalId);
    }
  }, [currentAccount, hospitals]);

  const h = hospitals.find((x) => x.id === id) ?? hospitals[0];
  const list = hospitals.filter((x) => `${x.name} ${x.area}`.toLowerCase().includes(q.toLowerCase()));
  const upd = (note: string, fn: (h: Hospital) => Hospital) => update(h.id, note, fn);

  const handleSelectHospital = (hospitalId: string) => {
    setId(hospitalId);
    quickLogin(hospitalId);
  };

  const setRes = (key: ResKey, label: string, patch: Partial<Resource>) =>
    upd(`${label} updated`, (x) => {
      const cur = x[key];
      const total = Math.max(0, patch.total ?? cur.total);
      const available = clamp(patch.available ?? cur.available, 0, total);
      return { ...x, [key]: { total, available } };
    });

  return (
    <div className="grid gap-4 p-4 lg:h-full lg:grid-cols-[330px_1fr] lg:p-5">
      {/* Hospital picker */}
      <aside className="glass flex min-h-0 flex-col overflow-hidden rounded-3xl lg:h-full">
        <div className="space-y-3 border-b border-white/8 p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-base font-semibold">Hospital Portal</h1>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 rounded-lg bg-signal/15 px-2.5 py-1 text-xs font-semibold text-signal ring-1 ring-inset ring-signal/30 hover:bg-signal/25"
            >
              <Plus size={13} /> Enroll Hospital
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Pick your hospital and keep numbers current. The triage console and 3D terrain map re-rank the instant you make changes.
          </p>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find hospital..."
              aria-label="Find hospital"
              className="w-full rounded-xl bg-black/30 py-2 pl-9 pr-3 text-sm outline-none ring-1 ring-inset ring-white/10 focus:ring-signal/60"
            />
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {list.map((x) => (
            <button
              key={x.id}
              onClick={() => handleSelectHospital(x.id)}
              aria-pressed={x.id === h.id}
              className={cn(
                'w-full rounded-2xl p-3 text-left ring-1 ring-inset transition',
                x.id === h.id ? 'bg-brand/15 ring-brand/50' : 'bg-white/4 ring-white/8 hover:bg-white/8',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-semibold truncate">{x.name}</span>
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    x.status === 'open' ? 'bg-ok' : x.status === 'busy' ? 'bg-warn' : 'bg-brand',
                  )}
                />
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                {x.area} · ICU {x.icu.available}/{x.icu.total} · {timeAgo(x.updatedAt, now)}
              </div>
              {x.registeredOnline && (
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-signal font-semibold">
                  <CheckCircle2 size={11} /> Newly Registered Online
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-2 border-t border-white/8 p-3">
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-xs font-semibold text-slate-300 ring-1 ring-white/10 hover:bg-white/10"
          >
            <ShieldCheck size={14} className="text-signal" /> Hospital Staff Login
          </Link>
          <Button className="w-full" onClick={() => { reset(); setId(hospitals[0].id); }}>
            <RotateCcw size={15} /> Reset Demo Data
          </Button>
        </div>
      </aside>

      {/* Editor */}
      <div className="min-h-0 space-y-4 lg:h-full lg:overflow-y-auto lg:pr-1">
        {/* Active Staff Authentication Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-signal/10 px-4 py-2.5 text-xs text-slate-200 ring-1 ring-inset ring-signal/25">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-signal" />
            <span>
              Active Session: <strong>{currentAccount?.adminName || 'Hospital Administrator'}</strong> ({currentAccount?.role || 'Admin'}) · Managing <strong>{h.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-1 font-semibold text-signal hover:underline">
              <ExternalLink size={12} /> View on Triage Console
            </Link>
            <Link to="/login" className="text-slate-400 hover:text-white hover:underline">
              Switch Account
            </Link>
          </div>
        </div>
        <Card>
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">{h.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">{h.area} · {h.phone}<Pill tone="signal">Saved {timeAgo(h.updatedAt, now)}</Pill></div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <Segmented<HospitalStatus> value={h.status} onChange={(status) => upd(`Status set to ${status}`, (x) => ({ ...x, status }))}
                options={[{ value: 'open', label: 'Accepting', tone: 'bg-ok text-slate-950' }, { value: 'busy', label: 'Busy', tone: 'bg-warn text-slate-950' }, { value: 'diverting', label: 'Diverting', tone: 'bg-brand text-white' }]} />
              <Button variant="danger" onClick={() => simulateRush(h.id)}><Zap size={15} />Simulate rush</Button>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <label htmlFor="load" className="font-semibold">Emergency department load</label>
              <span className="text-slate-400">{loadLabel(h.loadPct)} · {h.loadPct}%</span>
            </div>
            <input id="load" type="range" min={0} max={100} value={h.loadPct} onChange={(e) => upd(`Load set to ${e.target.value}%`, (x) => ({ ...x, loadPct: Number(e.target.value) }))} className="w-full" />
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <Card title="Resources" icon={<BedDouble size={16} />}>
              <div className="grid gap-3 sm:grid-cols-2">
                {([['beds', 'General beds', <BedDouble size={16} key="b" />], ['icu', 'ICU beds', <HeartPulse size={16} key="i" />], ['ventilators', 'Ventilators', <Wind size={16} key="v" />], ['erBays', 'ER bays', <Siren size={16} key="e" />]] as const).map(([key, label, icon]) => (
                  <ResourceTile key={key} label={label} icon={icon} value={h[key]}
                    onAvail={(n) => setRes(key, label, { available: n })} onTotal={(n) => setRes(key, label, { total: n })} />
                ))}
                <div className="rounded-2xl bg-black/25 p-3 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold"><Droplets size={16} className="text-brand-soft" />Blood units in stock</div>
                    <Stepper label="blood units" value={h.bloodUnits} max={999} onChange={(n) => upd(`Blood stock set to ${n} units`, (x) => ({ ...x, bloodUnits: n }))} />
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Specialist departments" icon={<HeartPulse size={16} />}>
              <p className="mb-3 text-xs text-slate-400">A department only counts as ready when a matching specialist is on duty.</p>
              <div className="space-y-2">
                {(Object.keys(SPECIALIST) as Capability[]).map((c) => {
                  const r = capability(h, c);
                  return (
                    <div key={c} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2.5">
                      <Toggle label={FACILITY_LABEL[c]} on={h.facilities[c]} onChange={(v) => upd(`${FACILITY_LABEL[c]} ${v ? 'enabled' : 'disabled'}`, (x) => ({ ...x, facilities: { ...x.facilities, [c]: v } }))} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{FACILITY_LABEL[c]}</div>
                        <div className={cn('text-xs', r.ok ? 'text-ok' : 'text-slate-500')}>{r.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="How patients see you right now" icon={<Activity size={16} />}>
              <div className="grid gap-2 sm:grid-cols-2">
                {ALL_FACILITIES.map((f) => {
                  const r = capability(h, f);
                  return (
                    <div key={f} className="flex items-start gap-2 rounded-xl bg-black/25 px-3 py-2">
                      {r.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-brand-soft" />}
                      <div><div className="text-sm font-semibold">{FACILITY_LABEL[f]}</div><div className="text-xs text-slate-400">{r.detail}</div></div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <DoctorsCard h={h} upd={upd} />
            <RoomsCard h={h} upd={upd} />
            <Card title="Live activity" icon={<Activity size={16} />}>
              {activity.length === 0 ? <p className="text-sm text-slate-500">Changes you save appear here and on every open triage console.</p> : (
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {activity.slice(0, 8).map((a) => (
                      <motion.li key={a.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                        <span className="flex-1"><span className="font-semibold">{a.hospitalName}</span> <span className="text-slate-300">{a.text}</span></span>
                        <span className="shrink-0 text-xs text-slate-500">{timeAgo(a.ts, now)}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass rounded-3xl p-5">
      {title && <h3 className="mb-4 flex items-center gap-2 font-display text-[15px] font-semibold"><span className="text-brand-soft">{icon}</span>{title}</h3>}
      {children}
    </section>
  );
}

function ResourceTile({ label, icon, value, onAvail, onTotal }: { label: string; icon: React.ReactNode; value: Resource; onAvail: (n: number) => void; onTotal: (n: number) => void }) {
  const used = value.total ? Math.round(((value.total - value.available) / value.total) * 100) : 0;
  return (
    <div className="rounded-2xl bg-black/25 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-brand-soft">{icon}</span>{label}</div>
      <div className={cn('mt-2 font-display text-3xl font-semibold', value.total > 0 && value.available === 0 && 'text-brand-soft')}>
        {value.available}<span className="text-sm font-medium text-slate-500"> / {value.total}</span>
      </div>
      <Meter value={used} className="my-2" />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><div className="mb-1 text-[11px] text-slate-400">Available</div><Stepper label={`${label} available`} value={value.available} max={value.total} onChange={onAvail} /></div>
        <div><div className="mb-1 text-[11px] text-slate-400">Capacity</div><Stepper label={`${label} capacity`} value={value.total} max={999} onChange={onTotal} /></div>
      </div>
    </div>
  );
}

function DoctorsCard({ h, upd }: { h: Hospital; upd: (note: string, fn: (h: Hospital) => Hospital) => void }) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState<Specialty>('Emergency Physician');
  const onDuty = h.doctors.filter((d) => d.onDuty).length;
  const setDoc = (d: Doctor, patch: Partial<Doctor>, note: string) => upd(note, (x) => ({ ...x, doctors: x.doctors.map((y) => (y.id === d.id ? { ...y, ...patch } : y)) }));
  const add = () => {
    if (!name.trim()) return;
    const d: Doctor = { id: uid(), name: name.trim(), specialty, onDuty: true };
    upd(`${d.name} (${d.specialty}) added on duty`, (x) => ({ ...x, doctors: [...x.doctors, d] }));
    setName('');
  };
  return (
    <Card title={`Doctors · ${onDuty} on duty`} icon={<UserRound size={16} />}>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {h.doctors.map((d) => (
            <motion.div key={d.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2.5">
              <Toggle label={`${d.name} on duty`} on={d.onDuty} onChange={(v) => setDoc(d, { onDuty: v }, `${d.name} marked ${v ? 'on duty' : 'off duty'}`)} />
              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-sm font-semibold', !d.onDuty && 'text-slate-500')}>{d.name}</div>
                <div className="text-xs text-slate-400">{d.specialty}</div>
              </div>
              <button aria-label={`Remove ${d.name}`} onClick={() => upd(`${d.name} removed`, (x) => ({ ...x, doctors: x.doctors.filter((y) => y.id !== d.id) }))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-white/8 hover:text-brand-soft"><Trash2 size={15} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Doctor name" aria-label="Doctor name"
          className="min-w-32 flex-1 rounded-xl bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-inset ring-white/10 focus:ring-signal/60" />
        <select value={specialty} onChange={(e) => setSpecialty(e.target.value as Specialty)} aria-label="Specialty" className="rounded-xl bg-white/6 px-3 py-2 text-sm outline-none ring-1 ring-inset ring-white/10">
          {SPECIALTIES.map((s) => <option key={s} className="bg-panel">{s}</option>)}
        </select>
        <Button variant="primary" onClick={add}><Plus size={15} />Add doctor</Button>
      </div>
    </Card>
  );
}

function RoomsCard({ h, upd }: { h: Hospital; upd: (note: string, fn: (h: Hospital) => Hospital) => void }) {
  const [type, setType] = useState<RoomType>('ICU');
  const grouped = useMemo(() => ROOM_TYPES.map((t) => ({ t, rooms: h.rooms.filter((r) => r.type === t) })).filter((g) => g.rooms.length), [h.rooms]);
  const cycle = (r: Room) => {
    const status = NEXT[r.status];
    upd(`${r.label} is now ${status}`, (x) => ({ ...x, rooms: x.rooms.map((y) => (y.id === r.id ? { ...y, status } : y)) }));
  };
  const add = () => upd(`New ${type} room added`, (x) => {
    const n = x.rooms.filter((r) => r.type === type).length + 1;
    return { ...x, rooms: [...x.rooms, { id: uid(), label: `${type} ${n}`, type, status: 'available' }] };
  });
  return (
    <Card title="Rooms and theatres" icon={<BedDouble size={16} />}>
      <p className="mb-3 text-xs text-slate-400">Tap a room to move it through available, occupied and cleaning.</p>
      <div className="space-y-3">
        {grouped.map(({ t, rooms }) => (
          <div key={t}>
            <div className="mb-1.5 text-xs text-slate-400">{t} · {rooms.filter((r) => r.status === 'available').length} of {rooms.length} available</div>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button key={r.id} onClick={() => cycle(r)} aria-label={`${r.label}, ${r.status}. Tap to change.`}
                  className={cn('rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ring-1 ring-inset transition hover:brightness-125', ROOM_STYLE[r.status])}>
                  {r.label} · {r.status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as RoomType)} aria-label="Room type" className="rounded-xl bg-white/6 px-3 py-2 text-sm outline-none ring-1 ring-inset ring-white/10">
          {ROOM_TYPES.map((t) => <option key={t} className="bg-panel">{t}</option>)}
        </select>
        <Button onClick={add}><Plus size={15} />Add room</Button>
      </div>
    </Card>
  );
}
