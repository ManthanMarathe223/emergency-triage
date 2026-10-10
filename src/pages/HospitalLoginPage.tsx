import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Lock,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Hash,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { useHospitals } from '../store/hospitals';
import { SpotlightCard, ShimmerButton, Badge } from '../components/ui';
import { API_BASE_URL } from '../lib/api';

export function HospitalLoginPage() {
  const navigate = useNavigate();
  const { accounts, currentAccount, login, quickLogin, isLoading } = useAuth();
  const hospitals = useHospitals((s) => s.hospitals);

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!registrationNumber.trim()) {
      setError('Please enter your Hospital Registration Number or Email.');
      return;
    }

    const result = await login(registrationNumber, password);
    if (result.success) {
      setSuccessNotice('Authentication successful! Connecting to hospital portal...');
      setTimeout(() => navigate('/portal'), 600);
    } else {
      setError(result.message || 'Authentication failed. Please check registration number and password.');
    }
  };

  const handleQuickSelect = (regNum: string, pass: string) => {
    setRegistrationNumber(regNum);
    setPassword(pass);
    setError(null);
  };

  const handleOneClickLogin = async (hospitalId: string, regNum?: string) => {
    setError(null);
    if (regNum) {
      setRegistrationNumber(regNum);
      setPassword('password123');
      const res = await login(regNum, 'password123');
      if (res.success) {
        setSuccessNotice('Switched active hospital session. Redirecting to portal...');
        setTimeout(() => navigate('/portal'), 500);
        return;
      }
    }
    quickLogin(hospitalId);
    setSuccessNotice('Switched active hospital profile. Redirecting to portal...');
    setTimeout(() => navigate('/portal'), 500);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl flex-col justify-center px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        {/* Left Column: Context & Quick Login Profiles */}
        <div className="space-y-6">
          <div>
            <Badge variant="signal" className="mb-3 py-1">
              <ShieldCheck size={14} /> Healthcare Staff Authentication Portal
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">
              Hospital Staff Login
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              Authorized hospital directors and emergency dispatch staff can log in using their official <strong>Registration Number</strong> to update bed telemetry, room availability, and active doctor rosters in real time.
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <SpotlightCard className="ring-1 ring-app">
            <div className="flex items-center justify-between border-b border-app pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles size={14} className="text-blue-600 dark:text-blue-400" /> Demo Hospital Profiles (FastAPI Synced)
              </div>
              <span className="text-[11px] text-muted">1-Click Evaluation</span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {accounts.slice(0, 4).map((acc) => {
                const isCurrent = currentAccount?.hospitalId === acc.hospitalId;
                const hospital = hospitals.find((h) => h.id === acc.hospitalId);
                const regNum = acc.registrationNumber || 'SANJ-001';

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleOneClickLogin(acc.hospitalId, regNum)}
                    className={`flex flex-col rounded-xl p-3 text-left transition border cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-200'
                        : 'bg-surface border-app hover:bg-surface-elevated text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs truncate">{acc.hospitalName}</span>
                      {isCurrent && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </div>
                    <span className="mt-1 text-[11px] text-secondary truncate">
                      Reg: <code className="font-mono font-bold text-blue-600 dark:text-blue-400">{regNum}</code> · {hospital?.area || 'Active'}
                    </span>
                    <span className="mt-1 font-semibold text-[10px] text-blue-600 dark:text-blue-400">
                      1-click access &rarr;
                    </span>
                  </button>
                );
              })}
            </div>
          </SpotlightCard>

          <div className="rounded-xl border border-app bg-surface p-4 text-xs text-secondary">
            <strong className="text-primary">Need to register a new medical center?</strong>
            <p className="mt-1">
              If your facility is not registered in the emergency dispatch cluster, submit your hospital profile and GPS coordinates via the onboarding portal.
            </p>
            <Link
              to="/register"
              className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Enroll your hospital facility now &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <SpotlightCard className="ring-1 ring-app">
          <div className="flex items-center gap-3 border-b border-app pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-primary">Hospital Staff Credentials</h2>
              <p className="text-xs text-secondary">Connects to {API_BASE_URL}</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60">
              <AlertCircle size={15} className="shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Hash size={13} className="text-blue-600 dark:text-blue-400" /> Registration Number / Email *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. SANJ-001 or admin@sanjeevani.org"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs text-primary placeholder-muted focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 font-semibold text-primary">
                  <Lock size={13} className="text-blue-600 dark:text-blue-400" /> Password *
                </label>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('SANJ-001', 'password123')}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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
                className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs text-primary placeholder-muted focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            <ShimmerButton
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <KeyRound size={16} /> Authenticate & Access Portal <ArrowRight size={16} />
                </>
              )}
            </ShimmerButton>
          </form>

          <div className="mt-5 border-t border-app pt-3 text-center text-xs text-secondary">
            Not registered yet?{' '}
            <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Register New Hospital
            </Link>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
