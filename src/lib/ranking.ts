import type { FacilityKey, Hospital, LatLng, RankedHospital } from '../types';
import { capability, loadLabel } from './capability';
import { etaMinutes, haversineKm } from './geo';

/** Initial weights from the project spec. Tune during testing. */
export const WEIGHTS = { distance: 0.4, load: 0.3, facility: 0.3 };

/**
 * Normalised suitability score. A hospital missing a required facility is flagged unsuitable and
 * heavily penalised, so being close never rescues a hospital that cannot treat the patient.
 */
export function rankHospitals(hospitals: Hospital[], origin: LatLng, required: FacilityKey[]): RankedHospital[] {
  const req: FacilityKey[] = required.length ? required : ['emergency'];
  const base = hospitals.map((hospital) => ({ hospital, distanceKm: haversineKm(origin, hospital) }));
  const maxD = Math.max(0.1, ...base.map((b) => b.distanceKm));

  return base
    .map(({ hospital, distanceKm }): RankedHospital => {
      const checks = req.map((key) => ({ key, ...capability(hospital, key) }));
      const matched = checks.filter((c) => c.ok).map(({ key, detail }) => ({ key, detail }));
      const missing = checks.filter((c) => !c.ok).map(({ key, detail }) => ({ key, detail }));
      const distanceF = 1 - distanceKm / maxD;
      const loadF = (1 - hospital.loadPct / 100) * (hospital.status === 'busy' ? 0.8 : 1);
      const facilityF = matched.length / req.length;
      let score = 100 * (WEIGHTS.distance * distanceF + WEIGHTS.load * loadF + WEIGHTS.facility * facilityF);
      const suitable = missing.length === 0;
      if (!suitable) score *= 0.45;
      return { hospital, distanceKm, etaMin: etaMinutes(distanceKm), score: Math.round(score), suitable, matched, missing };
    })
    .sort((a, b) => Number(b.suitable) - Number(a.suitable) || b.score - a.score);
}

export function whyThisHospital(r: RankedHospital): string[] {
  return [
    ...r.matched.map((m) => m.detail),
    `Estimated travel time ${r.etaMin} min (${r.distanceKm.toFixed(1)} km)`,
    `Hospital load ${loadLabel(r.hospital.loadPct)} (${r.hospital.loadPct}%)`,
  ];
}
