import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_HOSPITALS, DEFAULT_ORIGIN } from '../data/seed';
import type { ActivityItem, Hospital, LatLng } from '../types';
import { clamp, uid } from '../lib/util';

const KEY = 'etriage-hospitals-v1';

interface HospitalState {
  hospitals: Hospital[];
  activity: ActivityItem[];
  /** Register a newly created hospital into the system */
  addHospital: (h: Hospital) => void;
  /** Apply a change to one hospital. `note` is what shows in the live activity feed. */
  update: (id: string, note: string, fn: (h: Hospital) => Hospital) => void;
  /** Demo helper: pushes a hospital to near-full to show live re-routing on the triage page. */
  simulateRush: (id: string) => void;
  reset: () => void;
}

export const useHospitals = create<HospitalState>()(
  persist(
    (set, get) => ({
      hospitals: SEED_HOSPITALS,
      activity: [],
      addHospital: (newHospital) =>
        set((s) => {
          const item: ActivityItem = {
            id: uid(),
            hospitalId: newHospital.id,
            hospitalName: newHospital.name,
            text: 'Registered as active hospital in emergency dispatch network',
            ts: Date.now(),
          };
          return {
            hospitals: [newHospital, ...s.hospitals],
            activity: [item, ...s.activity].slice(0, 40),
          };
        }),
      update: (id, note, fn) =>
        set((s) => {
          const target = s.hospitals.find((h) => h.id === id);
          if (!target) return s;
          const next = { ...fn(target), updatedAt: Date.now() };
          const item: ActivityItem = { id: uid(), hospitalId: id, hospitalName: target.name, text: note, ts: Date.now() };
          return { hospitals: s.hospitals.map((h) => (h.id === id ? next : h)), activity: [item, ...s.activity].slice(0, 40) };
        }),
      simulateRush: (id) =>
        get().update(id, 'Rush of incoming cases: ICU and ventilators full', (h) => ({
          ...h, loadPct: 97, status: 'busy',
          icu: { ...h.icu, available: 0 }, ventilators: { ...h.ventilators, available: 0 },
          erBays: { ...h.erBays, available: Math.min(1, h.erBays.available) },
        })),
      reset: () => set({ hospitals: SEED_HOSPITALS.map((h) => ({ ...h, updatedAt: Date.now() })), activity: [] }),
    }),
    { name: KEY },
  ),
);

/** Real-time sync across browser tabs: edit in the portal tab, watch the triage tab re-rank instantly. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) void useHospitals.persist.rehydrate();
  });
}

export const clampRes = (v: number, total: number) => clamp(v, 0, total);

interface SessionState {
  origin: LatLng;
  locating: boolean;
  usingGps: boolean;
  locate: () => void;
}

export const useSession = create<SessionState>((set) => ({
  origin: DEFAULT_ORIGIN,
  locating: false,
  usingGps: false,
  locate: () => {
    if (!navigator.geolocation) return;
    set({ locating: true });
    navigator.geolocation.getCurrentPosition(
      (p) => set({ origin: { lat: p.coords.latitude, lng: p.coords.longitude }, locating: false, usingGps: true }),
      () => set({ locating: false }),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  },
}));
