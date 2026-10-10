import type { LatLng, Hospital, PatientCase, RankedHospital, FacilityKey } from '../types';
import type { RecommendRequest, RecommendResponse, LiveSnapshot } from './api';
import { deriveFacilities } from './capability';
import { statusFromTriage } from './mappers';
import { clamp } from './util';

const rng = (v: number | undefined, lo: number, hi: number) => (v === undefined ? undefined : clamp(v, lo, hi));

/** Builds the POST /triage/recommend body, clamping vitals to the ranges the API accepts. */
export function buildRecommendRequest(p: PatientCase, origin: LatLng): RecommendRequest {
  const v = p.vitals;
  const vitals = {
    spo2: rng(v.spo2, 0, 100), hr: rng(v.hr, 0, 350), sbp: rng(v.sbp, 0, 350), dbp: rng(v.dbp, 0, 250),
    rr: rng(v.rr, 0, 120), temp: rng(v.temp, 20, 45), gcs: rng(v.gcs, 3, 15),
  };
  return {
    latitude: origin.lat,
    longitude: origin.lng,
    symptoms: p.symptoms,
    vitals: Object.fromEntries(Object.entries(vitals).filter(([, x]) => x !== undefined)),
    age: rng(p.age, 0, 130),
    described_as_severe: !!p.severe,
    max_results: 10,
  };
}

const pct = (r: { total: number; available: number }) => r;

function fromLive(base: Hospital, live?: LiveSnapshot | null): Hospital {
  if (!live) return base;
  const beds = pct(live.general_beds);
  const icu = pct(live.icu_beds);
  const cap = beds.total + icu.total;
  const loadPct = cap > 0 ? Math.round(((cap - beds.available - icu.available) / cap) * 100) : 0;
  const doctors = base.doctors;
  return {
    ...base,
    status: statusFromTriage(live.triage_status),
    beds, icu, ventilators: pct(live.ventilators), oxygen: live.oxygen_cylinders,
    doctorsAvailable: live.doctors_on_duty,
    doctorsTotal: Math.max(base.doctorsTotal, live.doctors_on_duty),
    facilities: deriveFacilities(doctors),
    loadPct, hasOpsData: true,
  };
}

/** Converts the server response into the RankedHospital[] shape the existing components already use. */
export function toRanked(res: RecommendResponse, known: Hospital[]): RankedHospital[] {
  const byId = new Map(known.map((h) => [h.id, h]));
  const synthetic = (i: number, k: string) => `${k}${i}` as FacilityKey; // unique React keys only

  const ranked: RankedHospital[] = [...res.recommended]
    .sort((a, b) => a.rank - b.rank)
    .map((r) => {
      const stored = byId.get(r.hospital_id);
      const base: Hospital = stored ?? {
        id: r.hospital_id, name: r.name, area: r.address, lat: r.latitude, lng: r.longitude, status: 'open', loadPct: 0,
        beds: { total: 0, available: 0 }, icu: { total: 0, available: 0 }, ventilators: { total: 0, available: 0 },
        oxygen: 0, doctorsTotal: 0, doctorsAvailable: 0, facilities: { trauma: false, cardiac: false, neuro: false, burn: false },
        doctors: [], hasOpsData: true, updatedAt: Date.now(),
      };
      const missing = [
        ...r.missing_specialists.map((s) => `No ${s} on duty`),
        ...r.warnings,
      ];
      return {
        hospital: fromLive(base, r.live),
        distanceKm: r.distance_km,
        etaMin: Math.round(r.estimated_travel_minutes),
        score: Math.round(r.probability_all_resources * 100),
        suitable: r.reports_enough_units && r.specialists_on_duty,
        matched: [
          ...r.reasons.map((d, i) => ({ key: synthetic(i, 'r'), detail: d })),
          { key: synthetic(0, 'p'), detail: `${Math.round(r.probability_all_resources * 100)}% chance all needed resources are free on arrival` },
          { key: synthetic(0, 'e'), detail: `Expected ${Math.round(r.expected_minutes_to_care)} min to care` },
        ],
        missing: missing.map((d, i) => ({ key: synthetic(i, 'm'), detail: d })),
      };
    });

  const rest: RankedHospital[] = res.not_ranked.flatMap((n) => {
    const stored = byId.get(n.hospital_id);
    if (!stored) return [];
    return [{
      hospital: fromLive(stored, n.live),
      distanceKm: n.distance_km ?? 0,
      etaMin: Math.round(n.estimated_travel_minutes ?? 0),
      score: 0,
      suitable: false,
      matched: [],
      missing: [{ key: synthetic(0, 'n'), detail: n.detail || n.reason.replace(/_/g, ' ').toLowerCase() }],
    }];
  });

  return [...ranked, ...rest];
}
