import type { DoctorDTO, HospitalDataDTO, HospitalDataBody, HospitalDTO, PublicHospitalDTO } from './api';
import type { Doctor, Hospital, HospitalStatus } from '../types';
import { deriveFacilities } from './capability';

/**
 * triage_status <-> HospitalStatus.
 * CHECK the allowed `triage_status` values in your Swagger (/docs) and adjust STATUS_TO_TRIAGE if needed.
 */
export const STATUS_TO_TRIAGE: Record<HospitalStatus, string> = { open: 'NORMAL', busy: 'ELEVATED', diverting: 'CRITICAL' };

export function statusFromTriage(s?: string | null): HospitalStatus {
  const v = (s ?? 'NORMAL').toUpperCase();
  if (v === 'NORMAL' || v === 'OPEN' || v === 'LOW') return 'open';
  if (v === 'ELEVATED' || v === 'BUSY' || v === 'HIGH' || v === 'MODERATE') return 'busy';
  return 'diverting';
}

export const toDoctor = (d: DoctorDTO): Doctor => ({ id: d.doctor_id, name: d.name, specialty: d.specialization, onDuty: d.is_available });
export const toDoctorDTO = (d: Doctor): DoctorDTO => ({ doctor_id: d.id, name: d.name, specialization: d.specialty, is_available: d.onDuty });

const ts = (v?: string | null) => (v ? Date.parse(v) || 0 : 0);
export const recordTime = (r: HospitalDataDTO) => ts(r.updated_at) || ts(r.recorded_at) || ts(r.created_at);
export const recordId = (r: HospitalDataDTO) => r.id ?? r._id;

/** Latest operational record per hospital (uses timestamps when present, otherwise the first one returned). */
export function latestByHospital(records: HospitalDataDTO[]): Map<string, HospitalDataDTO> {
  const out = new Map<string, HospitalDataDTO>();
  for (const r of records) {
    const cur = out.get(r.hospital_id);
    if (!cur || recordTime(r) > recordTime(cur)) out.set(r.hospital_id, r);
  }
  return out;
}

function loadFrom(bedsTotal: number, bedsAvail: number, icuTotal: number, icuAvail: number): number {
  const cap = bedsTotal + icuTotal;
  if (cap <= 0) return 0;
  const used = cap - (bedsAvail + icuAvail);
  return Math.min(100, Math.max(0, Math.round((used / cap) * 100)));
}

export function toHospital(h: HospitalDTO, data?: HospitalDataDTO): Hospital {
  const doctors = (data?.doctors ?? []).map(toDoctor);
  const beds = data ? { total: data.general_beds_total, available: data.general_beds_available } : { total: h.total_beds, available: h.available_beds };
  const icu = { total: data?.icu_beds_total ?? 0, available: data?.icu_beds_available ?? 0 };
  return {
    id: h.id,
    name: h.name,
    area: h.address,
    registrationNumber: h.registration_number,
    phone: h.contact_number ?? undefined,
    email: h.email ?? undefined,
    lat: h.latitude,
    lng: h.longitude,
    status: statusFromTriage(data?.triage_status),
    loadPct: loadFrom(beds.total, beds.available, icu.total, icu.available),
    beds,
    icu,
    ventilators: { total: data?.ventilators_total ?? 0, available: data?.ventilators_available ?? 0 },
    oxygen: data?.oxygen_cylinders ?? 0,
    doctorsTotal: data?.doctors_total ?? 0,
    doctorsAvailable: data?.doctors_available ?? 0,
    facilities: deriveFacilities(doctors),
    doctors,
    notes: data?.notes ?? undefined,
    dataId: data ? recordId(data) : undefined,
    hasOpsData: !!data,
    updatedAt: (data && recordTime(data)) || ts(h.availability_updated_at) || Date.now(),
  };
}

/** Public endpoint only has name + location, so capacity is unknown. */
export function toPublicHospital(h: PublicHospitalDTO): Hospital {
  return {
    id: h.id, name: h.name, area: h.address, lat: h.latitude, lng: h.longitude,
    status: 'open', loadPct: 0,
    beds: { total: 0, available: 0 }, icu: { total: 0, available: 0 }, ventilators: { total: 0, available: 0 },
    oxygen: 0, doctorsTotal: 0, doctorsAvailable: 0,
    facilities: { trauma: false, cardiac: false, neuro: false, burn: false },
    doctors: [], hasOpsData: false, updatedAt: Date.now(),
  };
}

export function toDataBody(h: Hospital): HospitalDataBody {
  return {
    hospital_id: h.id,
    doctors: h.doctors.map(toDoctorDTO),
    general_beds_total: h.beds.total, general_beds_available: h.beds.available,
    icu_beds_total: h.icu.total, icu_beds_available: h.icu.available,
    ventilators_total: h.ventilators.total, ventilators_available: h.ventilators.available,
    oxygen_cylinders: h.oxygen,
    doctors_total: h.doctorsTotal, doctors_available: h.doctorsAvailable,
    triage_status: STATUS_TO_TRIAGE[h.status],
    notes: h.notes ?? '',
  };
}
