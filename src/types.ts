export type Severity = 'critical' | 'high' | 'moderate' | 'low';
export type Capability = 'trauma' | 'cardiac' | 'neuro' | 'burn';
export type FacilityKey = 'emergency' | 'icu' | 'ventilator' | 'oxygen' | Capability;
export type HospitalStatus = 'open' | 'busy' | 'diverting';
export type Specialty = string;
export type SymptomKey =
  | 'chest_pain' | 'breathing' | 'bleeding' | 'unconscious' | 'abdominal' | 'head_injury'
  | 'stroke' | 'burns' | 'trauma' | 'seizure' | 'fever';

export interface LatLng { lat: number; lng: number }
export interface Resource { total: number; available: number }
export interface Doctor { id: string; name: string; specialty: Specialty; onDuty: boolean }

/** Everything here comes from the backend (hospitals + hospitals-data). Nothing is predefined. */
export interface Hospital extends LatLng {
  id: string;
  name: string;
  /** Backend `address` */
  area: string;
  registrationNumber?: string;
  phone?: string;
  email?: string;
  /** Mapped from the backend `triage_status` */
  status: HospitalStatus;
  /** Derived from bed occupancy (general + ICU) */
  loadPct: number;
  beds: Resource;
  icu: Resource;
  ventilators: Resource;
  oxygen: number;
  doctorsTotal: number;
  doctorsAvailable: number;
  /** Derived from the specialisations of listed doctors */
  facilities: Record<Capability, boolean>;
  doctors: Doctor[];
  notes?: string;
  /** Id of the latest operational record, used for PATCH */
  dataId?: string;
  /** False when the backend has no operational record for this hospital */
  hasOpsData: boolean;
  updatedAt: number;
}

export interface ActivityItem { id: string; hospitalId: string; hospitalName: string; text: string; ts: number }

export interface Vitals { hr?: number; sbp?: number; dbp?: number; spo2?: number; rr?: number; temp?: number; gcs?: number }
export interface PatientCase { symptoms: SymptomKey[]; vitals: Vitals; age?: number; severe?: boolean }

export interface TriageResult {
  severity: Severity;
  category: string;
  score: number;
  reasons: string[];
  required: FacilityKey[];
}

export interface RankedHospital {
  hospital: Hospital;
  distanceKm: number;
  etaMin: number;
  score: number;
  suitable: boolean;
  matched: { key: FacilityKey; detail: string }[];
  missing: { key: FacilityKey; detail: string }[];
}

export type MessageKind = 'text' | 'triage' | 'reco' | 'list';
export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  kind: MessageKind;
  text?: string;
  triage?: TriageResult;
}
