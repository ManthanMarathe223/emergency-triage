import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { useHospitals } from '../store/hospitals';
import { SpotlightCard, ShimmerButton, Badge } from '../components/ui';

export function HospitalLoginPage() {
  const navigate = useNavigate();
  const { accounts, currentAccount, login, quickLogin } = useAuth();
  const hospitals = useHospitals((s) => s.hospitals);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = login(email, password);
    if (result.success) {
      setSuccessNotice('Authentication successful. Redirecting to live dashboard...');
      setTimeout(() => navigate('/portal'), 700);
    } else {
      setError(result.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuickSelect = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
  };

  const handleOneClickLogin = (hospitalId: string) => {
    quickLogin(hospitalId);
    setSuccessNotice('Switched active hospital profile. Loading portal...');
    setTimeout(() => navigate('/portal'), 600);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl flex-col justify-center px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        {/* Left Column: Context & Quick Login Profiles */}
        <div className="space-y-6">
          <div>
            <Badge variant="signal" className="mb-3 py-1">
              <ShieldCheck size={14} /> Healthcare Provider Access Portal
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
              Hospital Staff Authentication
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Authorized emergency department staff and hospital directors can authenticate here to adjust bed telemetry, emergency divert flags, and active specialist rosters in real-time.
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <SpotlightCard className="ring-1 ring-white/10" spotlightColor="rgba(34, 211, 238, 0.12)">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Sparkles size={14} className="text-signal" /> Quick 1-Click Demo Profiles
              </div>
              <span className="text-[11px] text-slate-400">Instant evaluation</span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {accounts.slice(0, 4).map((acc) => {
                const isCurrent = currentAccount?.hospitalId === acc.hospitalId;
                const hospital = hospitals.find((h) => h.id === acc.hospitalId);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleOneClickLogin(acc.hospitalId)}
                    className={`flex flex-col rounded-2xl p-3 text-left transition ring-1 ring-inset ${
                      isCurrent
                        ? 'bg-signal/15 ring-signal/50 text-white'
                        : 'bg-white/5 ring-white/10 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-white truncate">{acc.hospitalName}</span>
                      {isCurrent && <span className="h-2 w-2 rounded-full bg-ok" />}
                    </div>
                    <span className="mt-1 text-[11px] text-slate-400 truncate">
                      {acc.adminName} · {hospital?.area || 'Active'}
                    </span>
                    <span className="mt-1 font-mono text-[10px] text-signal/80">
                      1-click access &rarr;
                    </span>
                  </button>
                );
              })}
            </div>
          </SpotlightCard>

          <div className="rounded-2xl border border-white/8 bg-black/30 p-4 text-xs text-slate-400">
            <strong className="text-white">Need to register a new medical institution?</strong>
            <p className="mt-1">
              If your facility is not enrolled in the city emergency dispatch cluster, submit your hospital profile and coordinates via the registration portal.
            </p>
            <Link
              to="/register"
              className="mt-2 inline-flex items-center gap-1 font-semibold text-signal hover:underline"
            >
              Enroll your hospital now &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <SpotlightCard className="ring-1 ring-white/15" spotlightColor="rgba(255, 59, 87, 0.12)">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand shadow-lg">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Staff Credentials</h2>
              <p className="text-xs text-slate-400">Enter credentials to manage live stats</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/15 p-3 text-xs text-red-300 ring-1 ring-red-500/30">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-ok/15 p-3 text-xs text-ok ring-1 ring-ok/30">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Mail size={13} /> Hospital Email / ID
              </label>
              <input
                required
                type="email"
                placeholder="admin@sanjeevani.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Lock size={13} /> Security Password
                </label>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('admin@sanjeevani.org', 'password123')}
                  className="text-signal hover:underline"
                >
                  Fill Demo
                </button>
              </div>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
              />
            </div>

            <ShimmerButton
              type="submit"
              className="mt-2 w-full bg-signal text-slate-950 font-bold hover:bg-signal/90"
            >
              <KeyRound size={16} /> Authenticate & Access Portal <ArrowRight size={16} />
            </ShimmerButton>
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
            Not registered yet?{' '}
            <Link to="/register" className="font-semibold text-signal hover:underline">
              Register New Hospital
            </Link>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
