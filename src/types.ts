export type Severity = 'critical' | 'high' | 'moderate' | 'low';
export type Capability = 'trauma' | 'cardiac' | 'neuro' | 'burn';
export type FacilityKey = 'emergency' | 'icu' | 'ventilator' | 'bloodBank' | Capability;
export type HospitalStatus = 'open' | 'busy' | 'diverting';
export type Specialty =
  | 'Emergency Physician' | 'Intensivist' | 'Cardiologist' | 'Neurologist'
  | 'Trauma Surgeon' | 'Burn Specialist' | 'Pulmonologist' | 'General Surgeon';
export type RoomType = 'ICU' | 'OT' | 'ER' | 'Ward';
export type RoomStatus = 'available' | 'occupied' | 'cleaning';
export type SymptomKey =
  | 'chest_pain' | 'breathing' | 'bleeding' | 'unconscious' | 'abdominal' | 'head_injury'
  | 'stroke' | 'burns' | 'trauma' | 'seizure' | 'fever';

export interface LatLng { lat: number; lng: number }
export interface Resource { total: number; available: number }
export interface Doctor { id: string; name: string; specialty: Specialty; onDuty: boolean }
export interface Room { id: string; label: string; type: RoomType; status: RoomStatus }

export interface HospitalAccount {
  id: string;
  hospitalId: string;
  hospitalName: string;
  registrationNumber?: string;
  email: string;
  password?: string;
  adminName: string;
  role: 'admin' | 'director' | 'triage_nurse';
  createdAt: number;
}

export interface Hospital extends LatLng {
  id: string;
  name: string;
  registrationNumber?: string;
  area: string;
  address?: string;
  phone: string;
  email?: string;
  adminName?: string;
  registeredOnline?: boolean;
  buildingHeight?: number;
  status: HospitalStatus;
  loadPct: number;
  beds: Resource;
  icu: Resource;
  ventilators: Resource;
  erBays: Resource;
  bloodUnits: number;
  oxygenCylinders?: number;
  facilities: Record<Capability, boolean>;
  doctors: Doctor[];
  rooms: Room[];
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
