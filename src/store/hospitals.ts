import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_HOSPITALS, DEFAULT_ORIGIN } from '../data/seed';
import type { ActivityItem, Hospital, LatLng } from '../types';
import { clamp, uid } from '../lib/util';
import {
  apiGetPublicHospitals,
  apiCreateHospitalData,
  apiUpdateHospitalAvailability,
  API_BASE_URL,
} from '../lib/api';

const KEY = 'etriage-hospitals-v2';

interface HospitalState {
  hospitals: Hospital[];
  activity: ActivityItem[];
  isBackendConnected: boolean;
  /** Sync hospitals with FastAPI backend */
  fetchBackendHospitals: () => Promise<void>;
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
      isBackendConnected: false,

      fetchBackendHospitals: async () => {
        try {
          const publicList = await apiGetPublicHospitals();
          if (Array.isArray(publicList) && publicList.length > 0) {
            set({ isBackendConnected: true });

            // Merge backend hospitals with existing structure
            const currentList = get().hospitals;
            const updatedList: Hospital[] = publicList.map((pub) => {
              const existing = currentList.find((h) => h.id === pub.id || h.name.toLowerCase() === pub.name.toLowerCase());
              if (existing) {
                return {
                  ...existing,
                  id: pub.id,
                  name: pub.name,
                  lat: pub.latitude,
                  lng: pub.longitude,
                  address: pub.address,
                };
              }
              // Create default structure for new backend hospital
              return {
                id: pub.id,
                name: pub.name,
                area: pub.address || 'Central District',
                address: pub.address,
                phone: '+91 20 5550 1100',
                lat: pub.latitude,
                lng: pub.longitude,
                status: 'open',
                loadPct: 40,
                beds: { total: 100, available: 40 },
                icu: { total: 20, available: 6 },
                ventilators: { total: 12, available: 4 },
                erBays: { total: 10, available: 4 },
                bloodUnits: 45,
                facilities: { trauma: true, cardiac: true, neuro: false, burn: false },
                doctors: [
                  { id: uid(), name: 'Dr. On Duty', specialty: 'Emergency Physician', onDuty: true },
                ],
                rooms: [
                  { id: 'ER-1', label: 'ER Bay 1', type: 'ER', status: 'available' },
                  { id: 'ICU-1', label: 'ICU 1', type: 'ICU', status: 'available' },
                ],
                updatedAt: Date.now(),
              };
            });

            // Keep any seed hospitals not in backend as well
            const nonBackend = currentList.filter(
              (c) => !updatedList.some((u) => u.id === c.id || u.name.toLowerCase() === c.name.toLowerCase())
            );

            set({ hospitals: [...updatedList, ...nonBackend] });
          }
        } catch (err) {
          console.warn(`Backend server ${API_BASE_URL} sync fallback to local store`);
          set({ isBackendConnected: false });
        }
      },

      addHospital: (newHospital) =>
        set((s) => {
          const item: ActivityItem = {
            id: uid(),
            hospitalId: newHospital.id,
            hospitalName: newHospital.name,
            text: 'Registered into emergency dispatch telemetry network',
            ts: Date.now(),
          };
          return {
            hospitals: [newHospital, ...s.hospitals],
            activity: [item, ...s.activity].slice(0, 40),
          };
        }),

      update: (id, note, fn) => {
        set((s) => {
          const target = s.hospitals.find((h) => h.id === id);
          if (!target) return s;
          const next = { ...fn(target), updatedAt: Date.now() };
          const item: ActivityItem = { id: uid(), hospitalId: id, hospitalName: target.name, text: note, ts: Date.now() };

          // Asynchronously sync with FastAPI backend if authenticated
          (async () => {
            try {
              // 1. Update Availability
              await apiUpdateHospitalAvailability(id, next.beds.total, next.beds.available);

              // 2. Post Operational Data snapshot
              let triageStatus: 'NORMAL' | 'ELEVATED' | 'RUSH' | 'DIVERT' = 'NORMAL';
              if (next.status === 'diverting') triageStatus = 'DIVERT';
              else if (next.status === 'busy' || next.loadPct >= 85) triageStatus = 'RUSH';
              else if (next.loadPct >= 65) triageStatus = 'ELEVATED';

              await apiCreateHospitalData({
                hospital_id: id,
                doctors: next.doctors.map((d, i) => ({
                  doctor_id: d.id || `DOC-${i + 1}`,
                  name: d.name,
                  specialization: d.specialty,
                  is_available: d.onDuty,
                })),
                general_beds_total: next.beds.total,
                general_beds_available: next.beds.available,
                icu_beds_total: next.icu.total,
                icu_beds_available: next.icu.available,
                ventilators_total: next.ventilators.total,
                ventilators_available: next.ventilators.available,
                oxygen_cylinders: next.bloodUnits || 50,
                doctors_total: next.doctors.length,
                doctors_available: next.doctors.filter((d) => d.onDuty).length,
                triage_status: triageStatus,
                notes: note,
              });
            } catch (e) {
              // Graceful local update if token isn't present or endpoint fails
            }
          })();

          return { hospitals: s.hospitals.map((h) => (h.id === id ? next : h)), activity: [item, ...s.activity].slice(0, 40) };
        });
      },

      simulateRush: (id) =>
        get().update(id, 'Rush of incoming critical cases: ICU and ventilators full', (h) => ({
          ...h,
          loadPct: 96,
          status: 'busy',
          icu: { ...h.icu, available: 0 },
          ventilators: { ...h.ventilators, available: 0 },
          erBays: { ...h.erBays, available: Math.min(1, h.erBays.available) },
        })),

      reset: () => set({ hospitals: SEED_HOSPITALS.map((h) => ({ ...h, updatedAt: Date.now() })), activity: [] }),
    }),
    { name: KEY }
  )
);

/** Real-time sync across browser tabs */
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
  setOrigin: (coords: LatLng) => void;
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
      { enableHighAccuracy: true, timeout: 8000 }
    );
  },
  setOrigin: (origin) => set({ origin, usingGps: true }),
}));
