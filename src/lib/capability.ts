import type { Capability, Doctor, FacilityKey, Hospital, Specialty } from '../types';

export const FACILITY_LABEL: Record<FacilityKey, string> = {
  emergency: 'Emergency dept', icu: 'ICU', ventilator: 'Ventilator', oxygen: 'Oxygen supply',
  trauma: 'Trauma centre', cardiac: 'Cardiac care', neuro: 'Neuro / stroke', burn: 'Burn unit',
};
export const SPECIALIST: Record<Capability, Specialty> = {
  trauma: 'Trauma Surgeon', cardiac: 'Cardiologist', neuro: 'Neurologist', burn: 'Burn Specialist',
};
const MATCH: Record<Capability, RegExp> = { trauma: /trauma/i, cardiac: /cardio/i, neuro: /neuro/i, burn: /burn/i };
export const matchesCapability = (specialty: string, key: Capability) => MATCH[key].test(specialty);
/** A department exists when at least one listed doctor has a matching specialisation. */
export const deriveFacilities = (doctors: Doctor[]): Record<Capability, boolean> => ({
  trauma: doctors.some((d) => matchesCapability(d.specialty, 'trauma')),
  cardiac: doctors.some((d) => matchesCapability(d.specialty, 'cardiac')),
  neuro: doctors.some((d) => matchesCapability(d.specialty, 'neuro')),
  burn: doctors.some((d) => matchesCapability(d.specialty, 'burn')),
});

export const ALL_FACILITIES = Object.keys(FACILITY_LABEL) as FacilityKey[];

export interface CapResult { ok: boolean; detail: string }

/** Can this hospital handle this requirement right now? Uses live resources and on-duty doctors. */
export function capability(h: Hospital, key: FacilityKey): CapResult {
  switch (key) {
    case 'emergency':
      if (h.status === 'diverting') return { ok: false, detail: 'Diverting emergency cases' };
      if (!h.hasOpsData) return { ok: false, detail: 'No live capacity data' };
      if (h.beds.available <= 0) return { ok: false, detail: 'No general bed free' };
      return h.doctorsAvailable > 0
        ? { ok: true, detail: `${h.beds.available} beds free · ${h.doctorsAvailable} doctors available` }
        : { ok: false, detail: 'No doctor available' };
    case 'icu':
      return h.icu.available > 0
        ? { ok: true, detail: `${h.icu.available} ICU beds available` }
        : { ok: false, detail: 'No ICU bed available' };
    case 'ventilator':
      return h.ventilators.available > 0
        ? { ok: true, detail: `${h.ventilators.available} ventilators free` }
        : { ok: false, detail: 'No ventilator free' };
    case 'oxygen':
      return h.oxygen > 0
        ? { ok: true, detail: `${h.oxygen} oxygen cylinders in stock` }
        : { ok: false, detail: 'No oxygen cylinders in stock' };
    default: {
      if (!h.facilities[key]) return { ok: false, detail: `No ${FACILITY_LABEL[key].toLowerCase()}` };
      const sp = SPECIALIST[key];
      const n = h.doctors.filter((d) => d.onDuty && matchesCapability(d.specialty, key)).length;
      return n > 0
        ? { ok: true, detail: `${FACILITY_LABEL[key]} · ${n} ${sp.toLowerCase()} on duty` }
        : { ok: false, detail: `No ${sp.toLowerCase()} on duty` };
    }
  }
}

export const loadLabel = (pct: number) => (pct < 40 ? 'Low' : pct < 70 ? 'Medium' : 'High');
