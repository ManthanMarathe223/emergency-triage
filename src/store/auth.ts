import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HospitalAccount } from '../types';
import {
  apiLoginHospital,
  apiRegisterHospital,
  setStoredTokens,
  clearStoredTokens,
  apiGetAllHospitals,
  type HospitalRegisterPayload,
} from '../lib/api';

const AUTH_KEY = 'etriage-auth-v2';

export const SEED_ACCOUNTS: HospitalAccount[] = [
  {
    id: 'acc-sanjeevani',
    hospitalId: 'h-sanjeevani',
    hospitalName: 'Sanjeevani Heart Institute',
    registrationNumber: 'SANJ-001',
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
    registrationNumber: 'LIFE-002',
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
    registrationNumber: 'METRO-003',
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
    registrationNumber: 'CITY-004',
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
    registrationNumber: 'APEX-005',
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
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (hospitalId: string) => void;
  logout: () => void;
  registerHospitalBackend: (payload: HospitalRegisterPayload, adminName?: string) => Promise<{ success: boolean; message?: string; hospitalId?: string }>;
  registerAccount: (account: HospitalAccount) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      currentAccount: SEED_ACCOUNTS[0], // default active preview
      isLoading: false,
      login: async (identifier, password) => {
        set({ isLoading: true });
        const trimmed = identifier.trim();

        // 1. Try backend authentication first via registration_number
        try {
          const tokenRes = await apiLoginHospital({
            registration_number: trimmed,
            password,
          });

          if (tokenRes?.access_token) {
            setStoredTokens(tokenRes.access_token, tokenRes.refresh_token);

            // Fetch hospital profile
            let hospitalName = trimmed;
            let hospitalId = `h-${trimmed.toLowerCase()}`;
            try {
              const allHospitals = await apiGetAllHospitals();
              const found = allHospitals.find(
                (h) => h.registration_number.toLowerCase() === trimmed.toLowerCase() || h.id === hospitalId
              );
              if (found) {
                hospitalId = found.id;
                hospitalName = found.name;
              }
            } catch {}

            const account: HospitalAccount = {
              id: `acc-${hospitalId}`,
              hospitalId,
              hospitalName,
              registrationNumber: trimmed,
              email: `${trimmed.toLowerCase()}@hospital.org`,
              adminName: 'Hospital Administrator',
              role: 'admin',
              createdAt: Date.now(),
            };

            set((s) => ({
              accounts: [account, ...s.accounts.filter((a) => a.hospitalId !== hospitalId)],
              currentAccount: account,
              isLoading: false,
            }));

            return { success: true };
          }
        } catch (backendError: any) {
          console.warn('Backend login attempt failed, checking local accounts:', backendError.message);
        }

        // 2. Fallback to local accounts matching email or registrationNumber
        const found = get().accounts.find(
          (a) =>
            a.email.trim().toLowerCase() === trimmed.toLowerCase() ||
            (a.registrationNumber && a.registrationNumber.trim().toLowerCase() === trimmed.toLowerCase())
        );

        if (found) {
          if (found.password && found.password !== password) {
            set({ isLoading: false });
            return { success: false, message: 'Incorrect hospital credentials or security password' };
          }
          set({ currentAccount: found, isLoading: false });
          return { success: true };
        }

        set({ isLoading: false });
        return { success: false, message: 'Hospital account not found. Please check your Registration Number or Email.' };
      },

      quickLogin: (hospitalId) => {
        const found = get().accounts.find((a) => a.hospitalId === hospitalId);
        if (found) {
          set({ currentAccount: found });
        } else {
          const fallback: HospitalAccount = {
            id: `acc-${hospitalId}`,
            hospitalId,
            hospitalName: hospitalId,
            email: `admin@${hospitalId}.org`,
            adminName: 'Hospital Staff',
            role: 'admin',
            createdAt: Date.now(),
          };
          set((s) => ({
            accounts: [fallback, ...s.accounts],
            currentAccount: fallback,
          }));
        }
      },

      logout: () => {
        clearStoredTokens();
        set({ currentAccount: null });
      },

      registerHospitalBackend: async (payload, adminName = 'Hospital Admin') => {
        set({ isLoading: true });
        try {
          const res = await apiRegisterHospital(payload);
          if (res?.id) {
            // Attempt auto-login
            try {
              const tokenRes = await apiLoginHospital({
                registration_number: payload.registration_number,
                password: payload.password,
              });
              if (tokenRes?.access_token) {
                setStoredTokens(tokenRes.access_token, tokenRes.refresh_token);
              }
            } catch {}

            const newAccount: HospitalAccount = {
              id: `acc-${res.id}`,
              hospitalId: res.id,
              hospitalName: res.name,
              registrationNumber: res.registration_number,
              email: payload.email,
              password: payload.password,
              adminName,
              role: 'admin',
              createdAt: Date.now(),
            };

            set((s) => ({
              accounts: [newAccount, ...s.accounts],
              currentAccount: newAccount,
              isLoading: false,
            }));

            return { success: true, hospitalId: res.id };
          }
        } catch (err: any) {
          set({ isLoading: false });
          return { success: false, message: err.message || 'Failed to register hospital with backend' };
        }
        set({ isLoading: false });
        return { success: false, message: 'Registration completed locally.' };
      },

      registerAccount: (account) =>
        set((s) => ({
          accounts: [account, ...s.accounts],
          currentAccount: account,
        })),
    }),
    { name: AUTH_KEY }
  )
);
