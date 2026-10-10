import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, ShieldCheck, AlertCircle, KeyRound, CheckCircle2, ArrowRight, Hash, Loader2 } from 'lucide-react';
import { useAuth } from '../store/auth';
import { useHospitals } from '../store/hospitals';
import { SpotlightCard, ShimmerButton, Badge } from '../components/ui';

export function HospitalLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, registrationNumber: savedReg, login, logout } = useAuth();
  const refresh = useHospitals((s) => s.refresh);

  const [registrationNumber, setRegistrationNumber] = useState(savedReg ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(registrationNumber, password);
      await refresh();
      setDone(true);
      setTimeout(() => navigate('/portal'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none';

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl flex-col justify-center px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="space-y-6">
          <div>
            <Badge variant="signal" className="mb-3 py-1">
              <ShieldCheck size={14} /> Healthcare Provider Access Portal
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">Hospital Staff Authentication</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Sign in with your hospital registration number to update beds, ICU, ventilators, oxygen and doctor rosters. Changes are saved to the
              database and appear on the triage console within seconds.
            </p>
          </div>

          {isAuthenticated && (
            <div className="rounded-2xl border border-signal/30 bg-signal/10 p-4 text-sm text-slate-200">
              Signed in as <strong>{savedReg}</strong>.{' '}
              <Link to="/portal" className="font-semibold text-signal hover:underline">Open portal</Link>
              {' · '}
              <button onClick={logout} className="font-semibold text-slate-300 hover:underline">Sign out</button>
            </div>
          )}

          <div className="rounded-2xl border border-white/8 bg-black/30 p-4 text-xs text-slate-400">
            <strong className="text-white">Need to register a new medical institution?</strong>
            <p className="mt-1">Submit your hospital profile and coordinates through the registration page. Your registration number becomes your login.</p>
            <Link to="/register" className="mt-2 inline-flex items-center gap-1 font-semibold text-signal hover:underline">
              Enroll your hospital now &rarr;
            </Link>
          </div>
        </div>

        <SpotlightCard className="ring-1 ring-white/15" spotlightColor="rgba(255, 59, 87, 0.12)">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand shadow-lg">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Staff Credentials</h2>
              <p className="text-xs text-slate-400">Registration number and password</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/15 p-3 text-xs text-red-300 ring-1 ring-red-500/30">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {done && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-ok/15 p-3 text-xs text-ok ring-1 ring-ok/30">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>Signed in. Opening your portal…</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label htmlFor="reg" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Hash size={13} /> Registration number
              </label>
              <input id="reg" required autoComplete="username" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className={input} />
            </div>
            <div>
              <label htmlFor="pw" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Lock size={13} /> Password
              </label>
              <input id="pw" required type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
            </div>
            <ShimmerButton type="submit" disabled={busy} className="mt-2 w-full bg-signal font-bold text-slate-950 hover:bg-signal/90">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Sign in <ArrowRight size={16} />
            </ShimmerButton>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
            Not registered yet?{' '}
            <Link to="/register" className="font-semibold text-signal hover:underline">Register New Hospital</Link>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
