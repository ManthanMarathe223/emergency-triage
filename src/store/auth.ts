import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HospitalAccount } from '../types';

const AUTH_KEY = 'etriage-auth-v1';

export const SEED_ACCOUNTS: HospitalAccount[] = [
  {
    id: 'acc-sanjeevani',
    hospitalId: 'h-sanjeevani',
    hospitalName: 'Sanjeevani Heart Institute',
    email: 'admin@sanjeevani.org',
    password: 'password123',
    adminName: 'Dr. R. Kulkarni',
    role: 'director',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'acc-lifeline',
    hospitalId: 'h-lifeline',
    hospitalName: 'Lifeline Multispeciality',
    email: 'admin@lifeline.org',
    password: 'password123',
    adminName: 'Dr. A. Deshmukh',
    role: 'admin',
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'acc-metro',
    hospitalId: 'h-metro',
    hospitalName: 'Metro Neuro & Trauma Centre',
    email: 'admin@metro.org',
    password: 'password123',
    adminName: 'Dr. N. Bhosale',
    role: 'admin',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'acc-citycare',
    hospitalId: 'h-citycare',
    hospitalName: 'CityCare General Hospital',
    email: 'admin@citycare.org',
    password: 'password123',
    adminName: 'Dr. B. More',
    role: 'admin',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'acc-apex',
    hospitalId: 'h-apex',
    hospitalName: 'Apex Burn & Plastic Care',
    email: 'admin@apex.org',
    password: 'password123',
    adminName: 'Dr. G. Menon',
    role: 'director',
    createdAt: Date.now() - 86400000 * 1,
  },
];

interface AuthState {
  accounts: HospitalAccount[];
  currentAccount: HospitalAccount | null;
  login: (email: string, password: string) => { success: boolean; message?: string };
  quickLogin: (hospitalId: string) => void;
  logout: () => void;
  registerAccount: (account: HospitalAccount) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      currentAccount: SEED_ACCOUNTS[0], // default active session for seamless preview
      login: (email, password) => {
        const found = get().accounts.find(
          (a) => a.email.trim().toLowerCase() === email.trim().toLowerCase(),
        );
        if (!found) {
          return { success: false, message: 'Hospital account not found with this email' };
        }
        if (found.password !== password) {
          return { success: false, message: 'Incorrect hospital credentials or security key' };
        }
        set({ currentAccount: found });
        return { success: true };
      },
      quickLogin: (hospitalId) => {
        const found = get().accounts.find((a) => a.hospitalId === hospitalId);
        if (found) {
          set({ currentAccount: found });
        } else {
          // If a new hospital without pre-made account, create on the fly
          const fallback: HospitalAccount = {
            id: `acc-${hospitalId}`,
            hospitalId,
            hospitalName: hospitalId,
            email: `admin@${hospitalId}.org`,
            password: 'password123',
            adminName: 'Hospital Administrator',
            role: 'admin',
            createdAt: Date.now(),
          };
          set((s) => ({
            accounts: [fallback, ...s.accounts],
            currentAccount: fallback,
          }));
        }
      },
      logout: () => set({ currentAccount: null }),
      registerAccount: (account) =>
        set((s) => ({
          accounts: [account, ...s.accounts],
          currentAccount: account,
        })),
    }),
    { name: AUTH_KEY },
  ),
);
