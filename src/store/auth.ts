import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, clearTokens, getTokens, LOGOUT_EVENT, setTokens } from '../lib/api';

interface AuthState {
  /** True while valid tokens are stored. Tokens themselves live in lib/api.ts (localStorage). */
  isAuthenticated: boolean;
  registrationNumber: string | null;
  /** Throws ApiError on failure (401 wrong credentials, 422 invalid fields). */
  login: (registrationNumber: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: !!getTokens(),
      registrationNumber: null,
      login: async (registrationNumber, password) => {
        const reg = registrationNumber.trim();
        const t = await api.login(reg, password);
        setTokens(t);
        set({ isAuthenticated: true, registrationNumber: reg });
      },
      logout: () => {
        clearTokens();
        set({ isAuthenticated: false, registrationNumber: null });
      },
    }),
    {
      name: 'etriage-auth-v2',
      partialize: (s) => ({ registrationNumber: s.registrationNumber }),
      // The token store is the source of truth for "signed in".
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AuthState>),
        isAuthenticated: !!getTokens(),
      }),
    },
  ),
);

if (typeof window !== 'undefined') {
  // Fired by the API client when a refresh token is rejected.
  window.addEventListener(LOGOUT_EVENT, () => useAuth.setState({ isAuthenticated: false, registrationNumber: null }));
}
