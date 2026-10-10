import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, ThemeMode } from '../store/theme';
import { cn } from '../lib/util';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light theme', icon: Sun },
    { mode: 'dark', label: 'Dark theme', icon: Moon },
    { mode: 'system', label: 'System theme', icon: Laptop },
  ];

  return (
    <div
      className="inline-flex items-center rounded-xl p-1 border transition-colors bg-surface-muted border-app"
      role="radiogroup"
      aria-label="Color theme"
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const active = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            aria-label={label}
            onClick={() => setTheme(mode)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-all text-xs font-medium',
              active
                ? 'bg-surface text-primary shadow-sm ring-1 ring-app'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            )}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
