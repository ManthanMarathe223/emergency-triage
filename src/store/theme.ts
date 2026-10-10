import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

const STORAGE_KEY = 'ai_lifelink_theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(themeMode: ThemeMode) {
  if (typeof document === 'undefined') return 'dark';
  const effective = themeMode === 'system' ? getSystemTheme() : themeMode;
  const root = document.documentElement;
  
  if (effective === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
  return effective;
}

const initialMode: ThemeMode = (typeof localStorage !== 'undefined'
  ? (localStorage.getItem(STORAGE_KEY) as ThemeMode)
  : null) || 'system';

const initialEffective = applyThemeToDocument(initialMode);

export const useTheme = create<ThemeState>((set) => {
  // Listen for system theme changes if using system preference
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentTheme = useTheme.getState().theme;
      if (currentTheme === 'system') {
        const effective = applyThemeToDocument('system');
        set({ effectiveTheme: effective });
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }
  }

  return {
    theme: initialMode,
    effectiveTheme: initialEffective,
    setTheme: (newTheme: ThemeMode) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newTheme);
      }
      const effective = applyThemeToDocument(newTheme);
      set({ theme: newTheme, effectiveTheme: effective });
    },
  };
});
