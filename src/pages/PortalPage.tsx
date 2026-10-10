import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Lock,
  LogIn,
  AlertCircle,
  Hash,
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
  available: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700',
  occupied: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700',
  cleaning: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
};
type ResKey = 'beds' | 'icu' | 'ventilators' | 'erBays';

export function PortalPage() {
  const navigate = useNavigate();
  const hospitals = useHospitals((s) => s.hospitals);
  const activity = useHospitals((s) => s.activity);
  const update = useHospitals((s) => s.update);
  const simulateRush = useHospitals((s) => s.simulateRush);
  const reset = useHospitals((s) => s.reset);
  const fetchBackendHospitals = useHospitals((s) => s.fetchBackendHospitals);
  const { currentAccount, logout } = useAuth();
  const now = useNow(5000);

  // Fetch backend hospitals on mount
  useEffect(() => {
    fetchBackendHospitals();
  }, [fetchBackendHospitals]);

  // Active hospital ID determination
  const userHospitalId = currentAccount?.hospitalId;
  const authedHospital = useMemo(() => {
    if (!userHospitalId) return null;
    return hospitals.find(
      (x) =>
        x.id === userHospitalId ||
        (currentAccount?.registrationNumber && x.registrationNumber === currentAccount.registrationNumber) ||
        x.name.toLowerCase() === currentAccount.hospitalName.toLowerCase()
    ) || hospitals[0];
  }, [userHospitalId, hospitals, currentAccount]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const activeHospital = useMemo(() => {
    if (selectedId) {
      const found = hospitals.find((x) => x.id === selectedId);
      if (found) return found;
    }
    return authedHospital || hospitals[0];
  }, [selectedId, authedHospital, hospitals]);

  const canEditCurrentHospital = useMemo((): boolean => {
    if (!currentAccount || !activeHospital) return false;
    return Boolean(
      activeHospital.id === currentAccount.hospitalId ||
      activeHospital.name.toLowerCase() === currentAccount.hospitalName.toLowerCase() ||
      (currentAccount.registrationNumber && activeHospital.registrationNumber === currentAccount.registrationNumber)
    );
  }, [currentAccount, activeHospital]);

  // If user is not logged in, prompt authentication
  if (!currentAccount) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-xl flex-col justify-center px-4 py-8">
        <div className="rounded-2xl border border-app bg-surface p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            <Lock size={28} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-primary">Staff Authentication Required</h1>
          <p className="mt-2 text-xs leading-relaxed text-secondary">
            To manage live hospital beds, ICU capacity, and specialist rosters, please log in with your official hospital <strong>Registration Number</strong>.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700 py-2 text-xs"
              onClick={() => navigate('/login')}
            >
              <LogIn size={15} /> Hospital Staff Login
            </Button>
            <Button
              variant="outline"
              className="py-2 text-xs"
              onClick={() => navigate('/register')}
            >
              <Plus size={15} /> Enroll New Facility
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const h = activeHospital;
  const list = hospitals.filter((x) => `${x.name} ${x.area}`.toLowerCase().includes(q.toLowerCase()));
  const upd = (note: string, fn: (h: Hospital) => Hospital) => {
    if (!canEditCurrentHospital) return;
    update(h.id, note, fn);
  };

  const setRes = (key: ResKey, label: string, patch: Partial<Resource>) =>
    upd(`${label} updated`, (x) => {
      const cur = x[key];
      const total = Math.max(0, patch.total ?? cur.total);
      const available = clamp(patch.available ?? cur.available, 0, total);
      return { ...x, [key]: { total, available } };
    });

  return (
    <div className="grid gap-4 p-4 lg:h-full lg:grid-cols-[320px_1fr] lg:p-5">
      {/* Hospital Directory Sidebar */}
      <aside className="glass flex min-h-0 flex-col overflow-hidden rounded-2xl border border-app bg-surface lg:h-full">
        <div className="space-y-3 border-b border-app p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-sm font-bold text-primary">Hospital Portal</h1>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 text-xs font-semibold hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60"
            >
              <Plus size={13} /> Enroll Facility
            </Link>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Authenticated as <strong>{currentAccount.hospitalName}</strong>. Select a facility to view status or telemetry.
          </p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find hospital..."
              aria-label="Find hospital"
              className="w-full rounded-lg border border-app bg-surface-elevated py-1.5 pl-8 pr-3 text-xs text-primary outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-muted"
            />
          </div>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-3 bg-app">
          {list.map((x) => {
            const isUserFacility =
              x.id === currentAccount.hospitalId ||
              x.name.toLowerCase() === currentAccount.hospitalName.toLowerCase() ||
              (currentAccount.registrationNumber && x.registrationNumber === currentAccount.registrationNumber);

            return (
              <button
                key={x.id}
                onClick={() => setSelectedId(x.id)}
                aria-pressed={x.id === h.id}
                className={cn(
                  'w-full rounded-xl p-3 text-left border transition cursor-pointer',
                  x.id === h.id
                    ? 'bg-surface border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-surface border-app hover:border-strong'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs font-bold text-primary truncate">{x.name}</span>
                  <div className="flex items-center gap-1.5">
                    {isUserFacility && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        YOURS
                      </span>
                    )}
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        x.status === 'open' ? 'bg-emerald-500' : x.status === 'busy' ? 'bg-amber-500' : 'bg-red-500'
                      )}
                    />
                  </div>
                </div>
                <div className="mt-1 text-xs text-secondary">
                  {x.area} · ICU {x.icu.available}/{x.icu.total} · {timeAgo(x.updatedAt, now)}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-app p-3 bg-surface">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-app bg-surface-elevated py-1.5 text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-muted cursor-pointer"
          >
            <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" /> Log Out ({currentAccount.adminName})
          </button>
          <Button className="w-full text-xs py-1.5" onClick={() => { reset(); setSelectedId(hospitals[0].id); }}>
            <RotateCcw size={14} /> Reset Demo Data
          </Button>
        </div>
      </aside>

      {/* Main Hospital Telemetry Editor / Viewer */}
      <div className="min-h-0 space-y-4 lg:h-full lg:overflow-y-auto lg:pr-1">
        {/* Active Staff Session Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <UserCheck size={15} className="text-blue-600 dark:text-blue-400" />
            <span>
              Authenticated: <strong>{currentAccount.adminName}</strong> ({currentAccount.role}) · Registration No:{' '}
              <strong className="font-mono">{currentAccount.registrationNumber || 'SANJ-001'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 hover:underline">
              <ExternalLink size={12} /> View Triage Dispatch
            </Link>
          </div>
        </div>

        {/* Read-Only Notice if viewing another hospital */}
        {!canEditCurrentHospital && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Access Restricted (Read-Only View):</strong> You are authenticated to manage <strong>{currentAccount.hospitalName}</strong>. You can view telemetry for <strong>{h.name}</strong>, but only your authorized facility can modify its records.
            </span>
          </div>
        )}

        <Card>
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-primary">{h.name}</h2>
                {h.registrationNumber && (
                  <Pill tone="neutral"><Hash size={11} /> {h.registrationNumber}</Pill>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-secondary">{h.area} · {h.phone}<Pill tone="signal">Updated {timeAgo(h.updatedAt, now)}</Pill></div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Segmented<HospitalStatus>
                value={h.status}
                onChange={(status) => upd(`Status set to ${status}`, (x) => ({ ...x, status }))}
                options={[
                  { value: 'open', label: 'Accepting', tone: 'bg-emerald-600 text-white' },
                  { value: 'busy', label: 'Busy', tone: 'bg-amber-600 text-white' },
                  { value: 'diverting', label: 'Diverting', tone: 'bg-red-600 text-white' },
                ]}
              />
              {canEditCurrentHospital && (
                <Button variant="danger" onClick={() => simulateRush(h.id)}>
                  <Zap size={14} /> Simulate Rush
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <label htmlFor="load" className="font-semibold text-primary">Emergency Department Load</label>
              <span className="text-secondary">{loadLabel(h.loadPct)} ({h.loadPct}%)</span>
            </div>
            <input
              id="load"
              type="range"
              min={0}
              max={100}
              disabled={!canEditCurrentHospital}
              value={h.loadPct}
              onChange={(e) => upd(`Load set to ${e.target.value}%`, (x) => ({ ...x, loadPct: Number(e.target.value) }))}
              className="w-full accent-blue-600 cursor-pointer disabled:opacity-50"
            />
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-4">
            <Card title="Live Bed & Resource Telemetry" icon={<BedDouble size={16} />}>
              <div className="grid gap-3 sm:grid-cols-2">
                {([['beds', 'General Beds', <BedDouble size={15} key="b" />], ['icu', 'ICU Beds', <HeartPulse size={15} key="i" />], ['ventilators', 'Ventilators', <Wind size={15} key="v" />], ['erBays', 'ER Bays', <Siren size={15} key="e" />]] as const).map(([key, label, icon]) => (
                  <ResourceTile
                    key={key}
                    label={label}
                    icon={icon}
                    value={h[key]}
                    disabled={!canEditCurrentHospital}
                    onAvail={(n) => setRes(key, label, { available: n })}
                    onTotal={(n) => setRes(key, label, { total: n })}
                  />
                ))}
                <div className="rounded-xl border border-app bg-surface-elevated p-3 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Droplets size={15} className="text-red-600 dark:text-red-400" /> Blood Reserve Stock
                    </div>
                    {canEditCurrentHospital ? (
                      <Stepper label="blood units" value={h.bloodUnits} max={999} onChange={(n) => upd(`Blood stock set to ${n} units`, (x) => ({ ...x, bloodUnits: n }))} />
                    ) : (
                      <span className="text-xs font-bold text-primary">{h.bloodUnits} Units</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Specialist Departments" icon={<HeartPulse size={16} />}>
              <p className="mb-3 text-xs text-secondary">Toggle departments supported by on-duty medical staff.</p>
              <div className="space-y-2">
                {(Object.keys(SPECIALIST) as Capability[]).map((c) => {
                  const r = capability(h, c);
                  return (
                    <div key={c} className="flex items-center gap-3 rounded-xl border border-app bg-surface-elevated px-3 py-2">
                      <Toggle
                        label={FACILITY_LABEL[c]}
                        on={h.facilities[c]}
                        onChange={(v) => upd(`${FACILITY_LABEL[c]} ${v ? 'enabled' : 'disabled'}`, (x) => ({ ...x, facilities: { ...x.facilities, [c]: v } }))}
                      />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-primary">{FACILITY_LABEL[c]}</div>
                        <div className={cn('text-xs', r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted')}>{r.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Public Facility Readiness" icon={<Activity size={16} />}>
              <div className="grid gap-2 sm:grid-cols-2">
                {ALL_FACILITIES.map((f) => {
                  const r = capability(h, f);
                  return (
                    <div key={f} className="flex items-start gap-2 rounded-lg border border-app bg-surface-elevated px-2.5 py-2">
                      {r.ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <XCircle size={15} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />}
                      <div><div className="text-xs font-bold text-primary">{FACILITY_LABEL[f]}</div><div className="text-xs text-secondary">{r.detail}</div></div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <DoctorsCard h={h} upd={upd} canEdit={canEditCurrentHospital} />
            <RoomsCard h={h} upd={upd} canEdit={canEditCurrentHospital} />
            <Card title="Recent Activity Audit Trail" icon={<Activity size={16} />}>
              {activity.length === 0 ? <p className="text-xs text-muted">Telemetry updates will be logged here.</p> : (
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {activity.slice(0, 8).map((a) => (
                      <motion.li key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 text-xs border-b border-app/40 pb-1.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                        <span className="flex-1 text-primary"><span className="font-semibold">{a.hospitalName}</span> <span className="text-secondary">{a.text}</span></span>
                        <span className="shrink-0 text-[11px] text-muted">{timeAgo(a.ts, now)}</span>
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
    <section className="glass rounded-2xl border border-app bg-surface p-5 shadow-xs">
      {title && <h3 className="mb-3.5 flex items-center gap-2 font-display text-sm font-bold text-primary"><span className="text-blue-600 dark:text-blue-400">{icon}</span>{title}</h3>}
      {children}
    </section>
  );
}

function ResourceTile({ label, icon, value, disabled, onAvail, onTotal }: { label: string; icon: React.ReactNode; value: Resource; disabled?: boolean; onAvail: (n: number) => void; onTotal: (n: number) => void }) {
  const used = value.total ? Math.round(((value.total - value.available) / value.total) * 100) : 0;
  return (
    <div className="rounded-xl border border-app bg-surface-elevated p-3">
      <div className="flex items-center gap-2 text-xs font-bold text-primary"><span className="text-blue-600 dark:text-blue-400">{icon}</span>{label}</div>
      <div className={cn('mt-1 font-display text-2xl font-bold text-primary', value.total > 0 && value.available === 0 && 'text-red-600 dark:text-red-400')}>
        {value.available}<span className="text-xs font-normal text-muted"> / {value.total}</span>
      </div>
      <Meter value={used} className="my-2" />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="mb-1 text-[11px] text-secondary">Available</div>
          {!disabled ? (
            <Stepper label={`${label} available`} value={value.available} max={value.total} onChange={onAvail} />
          ) : (
            <span className="text-xs font-bold text-primary">{value.available}</span>
          )}
        </div>
        <div>
          <div className="mb-1 text-[11px] text-secondary">Capacity</div>
          {!disabled ? (
            <Stepper label={`${label} capacity`} value={value.total} max={999} onChange={onTotal} />
          ) : (
            <span className="text-xs font-bold text-primary">{value.total}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function DoctorsCard({ h, upd, canEdit }: { h: Hospital; upd: (note: string, fn: (h: Hospital) => Hospital) => void; canEdit: boolean }) {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState<Specialty>('Emergency Physician');
  const onDuty = h.doctors.filter((d) => d.onDuty).length;
  const setDoc = (d: Doctor, patch: Partial<Doctor>, note: string) => upd(note, (x) => ({ ...x, doctors: x.doctors.map((y) => (y.id === d.id ? { ...y, ...patch } : y)) }));
  const add = () => {
    if (!name.trim() || !canEdit) return;
    const d: Doctor = { id: uid(), name: name.trim(), specialty, onDuty: true };
    upd(`${d.name} (${d.specialty}) added on duty`, (x) => ({ ...x, doctors: [...x.doctors, d] }));
    setName('');
  };
  return (
    <Card title={`Active Doctor Roster (${onDuty} on duty)`} icon={<UserRound size={16} />}>
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {h.doctors.map((d) => (
            <motion.div key={d.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-lg border border-app bg-surface-elevated px-3 py-2">
              <Toggle label={`${d.name} on duty`} on={d.onDuty} onChange={(v) => setDoc(d, { onDuty: v }, `${d.name} marked ${v ? 'on duty' : 'off duty'}`)} />
              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-xs font-bold text-primary', !d.onDuty && 'text-muted')}>{d.name}</div>
                <div className="text-[11px] text-secondary">{d.specialty}</div>
              </div>
              {canEdit && (
                <button aria-label={`Remove ${d.name}`} onClick={() => upd(`${d.name} removed`, (x) => ({ ...x, doctors: x.doctors.filter((y) => y.id !== d.id) }))} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:text-red-600 hover:bg-surface-muted cursor-pointer"><Trash2 size={14} /></button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {canEdit && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Physician / Surgeon Name" aria-label="Doctor name"
            className="min-w-28 flex-1 rounded-lg border border-app bg-surface-elevated px-3 py-1.5 text-xs text-primary outline-none focus:border-blue-600" />
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value as Specialty)} aria-label="Specialty" className="rounded-lg border border-app bg-surface-elevated px-2.5 py-1.5 text-xs text-primary outline-none cursor-pointer">
            {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Button variant="primary" className="py-1.5 text-xs" onClick={add}><Plus size={14} />Add Doctor</Button>
        </div>
      )}
    </Card>
  );
}

function RoomsCard({ h, upd, canEdit }: { h: Hospital; upd: (note: string, fn: (h: Hospital) => Hospital) => void; canEdit: boolean }) {
  const [type, setType] = useState<RoomType>('ICU');
  const grouped = useMemo(() => ROOM_TYPES.map((t) => ({ t, rooms: h.rooms.filter((r) => r.type === t) })).filter((g) => g.rooms.length), [h.rooms]);
  const cycle = (r: Room) => {
    if (!canEdit) return;
    const status = NEXT[r.status];
    upd(`${r.label} is now ${status}`, (x) => ({ ...x, rooms: x.rooms.map((y) => (y.id === r.id ? { ...y, status } : y)) }));
  };
  const add = () => {
    if (!canEdit) return;
    upd(`New ${type} room added`, (x) => {
      const n = x.rooms.filter((r) => r.type === type).length + 1;
      return { ...x, rooms: [...x.rooms, { id: uid(), label: `${type} ${n}`, type, status: 'available' }] };
    });
  };
  return (
    <Card title="Emergency Rooms & Operating Theatres" icon={<BedDouble size={16} />}>
      <p className="mb-2.5 text-xs text-secondary">Click any room tile to transition between available, occupied, and cleaning.</p>
      <div className="space-y-3">
        {grouped.map(({ t, rooms }) => (
          <div key={t}>
            <div className="mb-1 text-[11px] font-semibold text-secondary">{t} Units · {rooms.filter((r) => r.status === 'available').length} of {rooms.length} available</div>
            <div className="flex flex-wrap gap-1.5">
              {rooms.map((r) => (
                <button key={r.id} onClick={() => cycle(r)} aria-label={`${r.label}, ${r.status}. Tap to change.`}
                  className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold capitalize border transition cursor-pointer', ROOM_STYLE[r.status])}>
                  {r.label} · {r.status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {canEdit && (
        <div className="mt-3.5 flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as RoomType)} aria-label="Room type" className="rounded-lg border border-app bg-surface-elevated px-2.5 py-1.5 text-xs text-primary outline-none cursor-pointer">
            {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <Button className="py-1.5 text-xs" onClick={add}><Plus size={14} />Add Room</Button>
        </div>
      )}
    </Card>
  );
}
