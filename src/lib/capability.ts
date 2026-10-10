import type { Capability, FacilityKey, Hospital, Specialty } from '../types';

export const FACILITY_LABEL: Record<FacilityKey, string> = {
  emergency: 'Emergency dept', icu: 'ICU', ventilator: 'Ventilator', bloodBank: 'Blood support',
  trauma: 'Trauma centre', cardiac: 'Cardiac care', neuro: 'Neuro / stroke', burn: 'Burn unit',
};
export const SPECIALIST: Record<Capability, Specialty> = {
  trauma: 'Trauma Surgeon', cardiac: 'Cardiologist', neuro: 'Neurologist', burn: 'Burn Specialist',
};
export const ALL_FACILITIES = Object.keys(FACILITY_LABEL) as FacilityKey[];

export interface CapResult { ok: boolean; detail: string }

/** Can this hospital handle this requirement right now? Uses live resources and on-duty doctors. */
export function capability(h: Hospital, key: FacilityKey): CapResult {
  switch (key) {
    case 'emergency':
      if (h.status === 'diverting') return { ok: false, detail: 'Diverting emergency cases' };
      return h.erBays.available > 0
        ? { ok: true, detail: `${h.erBays.available} ER bays free` }
        : { ok: false, detail: 'No ER bay free' };
    case 'icu':
      return h.icu.available > 0
        ? { ok: true, detail: `${h.icu.available} ICU beds available` }
        : { ok: false, detail: 'No ICU bed available' };
    case 'ventilator':
      return h.ventilators.available > 0
        ? { ok: true, detail: `${h.ventilators.available} ventilators free` }
        : { ok: false, detail: 'No ventilator free' };
    case 'bloodBank':
      return h.bloodUnits > 0
        ? { ok: true, detail: `${h.bloodUnits} blood units in stock` }
        : { ok: false, detail: 'Blood stock empty' };
    default: {
      if (!h.facilities[key]) return { ok: false, detail: `No ${FACILITY_LABEL[key].toLowerCase()}` };
      const sp = SPECIALIST[key];
      const n = h.doctors.filter((d) => d.onDuty && d.specialty === sp).length;
      return n > 0
        ? { ok: true, detail: `${FACILITY_LABEL[key]} · ${n} ${sp.toLowerCase()} on duty` }
        : { ok: false, detail: `No ${sp.toLowerCase()} on duty` };
    }
  }
}

export const loadLabel = (pct: number) => (pct < 40 ? 'Low' : pct < 70 ? 'Medium' : 'High');
