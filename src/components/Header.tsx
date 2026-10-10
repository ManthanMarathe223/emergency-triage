import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LocateFixed,
  Loader2,
  Stethoscope,
  Building2,
  PlusCircle,
  LogIn,
  LogOut,
  UserCheck,
  Menu,
  X,
  Activity,
} from 'lucide-react';
import { useSession, useHospitals } from '../store/hospitals';
import { useAuth } from '../store/auth';
import { useNow } from '../hooks/useNow';
import { cn, timeAgo } from '../lib/util';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { locate, locating, usingGps } = useSession();
  const latest = useHospitals((s) => Math.max(...s.hospitals.map((h) => h.updatedAt)));
  const { currentAccount, logout } = useAuth();
  const now = useNow(5000);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs md:text-sm font-medium transition',
      isActive
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/60'
        : 'text-secondary hover:text-primary hover:bg-surface-elevated'
    );

  return (
    <header className="sticky top-0 z-30 border-b border-app bg-surface px-4 py-2.5 md:px-6 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="grid h-9 w-9 md:h-10 md:w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm transition group-hover:bg-blue-700">
            <Activity className="h-5 w-5 md:h-6 md:w-6" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm md:text-[15px] font-bold text-primary tracking-tight">
              AI-LifeLink
            </div>
            <div className="text-[11px] text-secondary">Clinical Triage & Hospital Dispatch</div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Main navigation">
          <NavLink to="/" end className={linkClass}>
            <Stethoscope size={15} />
            Triage Console
          </NavLink>
          <NavLink to="/portal" className={linkClass}>
            <Building2 size={15} />
            Hospital Portal
          </NavLink>
          <NavLink to="/register" className={linkClass}>
            <PlusCircle size={15} className="text-blue-600 dark:text-blue-400" />
            Register Hospital
          </NavLink>
          <NavLink to="/login" className={linkClass}>
            <LogIn size={15} />
            Staff Login
          </NavLink>
        </nav>

        {/* Right Tools, Theme Switcher & Auth Status */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle Component */}
          <ThemeToggle />

          {/* Active Logged-in Staff Badge */}
          {currentAccount ? (
            <div className="hidden items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 xl:flex">
              <UserCheck size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="font-medium truncate max-w-[140px]">
                {currentAccount.hospitalName}
              </span>
              <button
                onClick={logout}
                title="Log out"
                className="text-secondary hover:text-primary cursor-pointer"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-xl border border-app bg-surface-elevated px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-muted sm:flex"
            >
              <LogIn size={14} className="text-blue-600 dark:text-blue-400" /> Staff Login
            </Link>
          )}

          {/* Live Data Sync Status */}
          <div className="hidden items-center gap-2 rounded-full border border-app bg-surface-elevated px-3 py-1 text-xs text-secondary sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">Live sync · {timeAgo(latest, now)}</span>
          </div>

          {/* GPS Location Button */}
          <button
            onClick={locate}
            className="flex items-center gap-1.5 rounded-xl border border-app bg-surface-elevated px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-muted transition cursor-pointer"
          >
            {locating ? (
              <Loader2 size={14} className="animate-spin text-blue-600 dark:text-blue-400" />
            ) : (
              <LocateFixed size={14} className={usingGps ? 'text-blue-600 dark:text-blue-400' : ''} />
            )}
            <span className="hidden md:inline">
              {usingGps ? 'GPS Active' : 'Use GPS'}
            </span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-app bg-surface-elevated text-secondary hover:text-primary lg:hidden cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mt-3 space-y-1.5 border-t border-app pt-3 lg:hidden">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={linkClass}
          >
            <Stethoscope size={16} /> Triage Console
          </NavLink>
          <NavLink
            to="/portal"
            onClick={() => setMobileMenuOpen(false)}
            className={linkClass}
          >
            <Building2 size={16} /> Hospital Portal
          </NavLink>
          <NavLink
            to="/register"
            onClick={() => setMobileMenuOpen(false)}
            className={linkClass}
          >
            <PlusCircle size={16} className="text-blue-600 dark:text-blue-400" /> Register Hospital
          </NavLink>
          <NavLink
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className={linkClass}
          >
            <LogIn size={16} /> Staff Login
          </NavLink>
        </div>
      )}
    </header>
  );
}
