import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, MapPin, BedDouble, ShieldCheck, CheckCircle2, Lock, Mail, ArrowRight, Sparkles, Compass, Loader2, AlertCircle, Hash } from 'lucide-react';
import { api } from '../lib/api';
import { STATUS_TO_TRIAGE } from '../lib/mappers';
import { useHospitals, useSession } from '../store/hospitals';
import { useAuth } from '../store/auth';
import { Button } from '../components/ui';

const field =
  'w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300';

/** Number input that allows an empty field (no predefined values). */
function Num({ value, onChange, min = 0, step = 1 }: { value: string; onChange: (v: string) => void; min?: number; step?: number | 'any' }) {
  return <input required type="number" inputMode="decimal" min={min} step={step} value={value} onChange={(e) => onChange(e.target.value)} className={field} />;
}

function Section({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-6 ring-1 ring-white/10">
      <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal/15 text-signal">{icon}</div>
        <div>
          <h2 className="font-display text-base font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{hint}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function RegisterHospitalPage() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const refresh = useHospitals((s) => s.refresh);
  const sessionOrigin = useSession((s) => s.origin);

  const [f, setF] = useState({
    name: '', registration_number: '', address: '', contact_number: '', email: '', password: '',
    latitude: '', longitude: '',
    general_total: '', general_avail: '', icu_total: '', icu_avail: '', vent_total: '', vent_avail: '',
    oxygen: '', doctors_total: '', doctors_avail: '',
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const n = (s: string) => Number(s);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pairs: [string, string, string][] = [
      [f.general_avail, f.general_total, 'General beds'], [f.icu_avail, f.icu_total, 'ICU beds'],
      [f.vent_avail, f.vent_total, 'Ventilators'], [f.doctors_avail, f.doctors_total, 'Doctors'],
    ];
    const bad = pairs.find(([a, t]) => n(a) > n(t));
    if (bad) return setError(`${bad[2]}: available cannot be greater than total.`);
    if (Math.abs(n(f.latitude)) > 90 || Math.abs(n(f.longitude)) > 180) return setError('Latitude must be within ±90 and longitude within ±180.');

    setBusy(true);
    let created = false;
    try {
      const hospital = await api.register({
        name: f.name.trim(),
        registration_number: f.registration_number.trim(),
        password: f.password,
        address: f.address.trim(),
        latitude: n(f.latitude),
        longitude: n(f.longitude),
        contact_number: f.contact_number.trim() || undefined,
        email: f.email.trim() || undefined,
        total_beds: n(f.general_total),
        available_beds: n(f.general_avail),
        is_active: true,
      });
      created = true;
      await login(f.registration_number, f.password);
      await api.createData({
        hospital_id: hospital.id,
        doctors: [],
        general_beds_total: n(f.general_total), general_beds_available: n(f.general_avail),
        icu_beds_total: n(f.icu_total), icu_beds_available: n(f.icu_avail),
        ventilators_total: n(f.vent_total), ventilators_available: n(f.vent_avail),
        oxygen_cylinders: n(f.oxygen),
        doctors_total: n(f.doctors_total), doctors_available: n(f.doctors_avail),
        triage_status: STATUS_TO_TRIAGE.open,
        notes: '',
      });
      await refresh();
      setDone(hospital.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(created ? `Hospital was created, but saving its capacity failed: ${msg}. Sign in and update it from the portal.` : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-signal/10 px-4 py-1.5 text-xs font-semibold text-signal ring-1 ring-inset ring-signal/25">
          <Sparkles size={14} /> Hospital Enrollment & Live Network Registration
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">Register Hospital Facility</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Your details are saved to the database. Once registered, your hospital appears on the triage map for signed-in staff and is ranked using the capacity you enter here.
        </p>
      </div>

      {done ? (
        <div className="glass mx-auto max-w-xl rounded-3xl p-8 text-center ring-1 ring-ok/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ok/15 text-ok shadow-lg"><CheckCircle2 size={36} /></div>
          <h2 className="mt-5 font-display text-2xl font-bold text-white">Hospital enrolled</h2>
          <p className="mt-2 text-sm text-slate-300"><strong>{done}</strong> is saved and you are signed in with registration number <strong>{f.registration_number}</strong>.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button className="bg-signal text-slate-950 hover:bg-signal/90" onClick={() => navigate('/portal')}><Building2 size={16} /> Open Hospital Portal</Button>
            <Button variant="ghost" onClick={() => navigate('/')}><ArrowRight size={16} /> View on Triage Map</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/15 p-3 text-sm text-red-300 ring-1 ring-red-500/30">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" /><span>{error}</span>
            </div>
          )}

          <Section icon={<Building2 size={18} />} title="Facility identity & contact" hint="Registration number is your login ID">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label}>Hospital name *</label>
                <input required value={f.name} onChange={(e) => set('name')(e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}><Hash size={12} className="mr-1 inline" />Registration number *</label>
                <input required value={f.registration_number} onChange={(e) => set('registration_number')(e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}>Address *</label>
                <input required value={f.address} onChange={(e) => set('address')(e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}>Emergency phone</label>
                <input value={f.contact_number} onChange={(e) => set('contact_number')(e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}><Mail size={12} className="mr-1 inline" />Email</label>
                <input type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} className={field} />
              </div>
            </div>
          </Section>

          <Section icon={<MapPin size={18} />} title="Location" hint="Used for distance scoring and the map pin">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Latitude *</label><Num value={f.latitude} onChange={set('latitude')} min={-90} step="any" /></div>
              <div><label className={label}>Longitude *</label><Num value={f.longitude} onChange={set('longitude')} min={-180} step="any" /></div>
            </div>
            <button
              type="button"
              onClick={() => setF((p) => ({ ...p, latitude: sessionOrigin.lat.toFixed(5), longitude: sessionOrigin.lng.toFixed(5) }))}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/10"
            >
              <Compass size={14} className="text-signal" /> Use my current location
            </button>
            <p className="mt-2 text-[11px] text-slate-500">Press “Use My GPS” in the header first to replace the default map centre with your real position.</p>
          </Section>

          <Section icon={<BedDouble size={18} />} title="Current capacity" hint="Saved as the first operational record">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {([
                ['General beds', 'general_avail', 'general_total'],
                ['ICU beds', 'icu_avail', 'icu_total'],
                ['Ventilators', 'vent_avail', 'vent_total'],
                ['Doctors', 'doctors_avail', 'doctors_total'],
              ] as const).map(([title, a, t]) => (
                <div key={title} className="rounded-2xl bg-black/30 p-3.5 ring-1 ring-white/5">
                  <div className="text-xs font-semibold text-slate-300">{title}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div><span className="text-[10px] text-slate-400">Available</span><Num value={f[a]} onChange={set(a)} /></div>
                    <div><span className="text-[10px] text-slate-400">Total</span><Num value={f[t]} onChange={set(t)} /></div>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl bg-black/30 p-3.5 ring-1 ring-white/5">
                <div className="text-xs font-semibold text-slate-300">Oxygen cylinders</div>
                <div className="mt-3"><Num value={f.oxygen} onChange={set('oxygen')} /></div>
              </div>
            </div>
          </Section>

          <Section icon={<Lock size={18} />} title="Account password" hint="Used with your registration number to sign in">
            <input required type="password" autoComplete="new-password" value={f.password} onChange={(e) => set('password')(e.target.value)} className={field} placeholder="••••••••" />
          </Section>

          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck size={13} /> Already registered? <Link to="/login" className="font-semibold text-signal hover:underline">Sign in</Link>
            </p>
            <div className="flex w-full gap-3 sm:w-auto">
              <Button type="button" variant="ghost" onClick={() => navigate('/')} className="flex-1 sm:flex-none">Cancel</Button>
              <Button type="submit" disabled={busy} className="flex-1 bg-signal font-semibold text-slate-950 shadow-lg shadow-signal/20 hover:bg-signal/90 sm:flex-none">
                {busy ? <Loader2 size={16} className="animate-spin" /> : null} Complete registration <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
