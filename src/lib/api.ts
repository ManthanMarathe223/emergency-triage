export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://ai-linklife-backend.vercel.app'
).replace(/\/$/, '');

const TOKEN_KEY = 'ai_lifelink_access_token';
const REFRESH_KEY = 'ai_lifelink_refresh_token';
const HOSPITAL_INFO_KEY = 'ai_lifelink_hospital_info';

export function getStoredTokens() {
  if (typeof localStorage === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearStoredTokens() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(HOSPITAL_INFO_KEY);
}

export function getStoredHospitalInfo() {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(HOSPITAL_INFO_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredHospitalInfo(info: any) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(HOSPITAL_INFO_KEY, JSON.stringify(info));
}

// Request helper with auto Bearer token inclusion
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = getStoredTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && endpoint !== '/hospitals/login' && endpoint !== '/hospitals/refresh') {
    // Attempt token refresh
    const { refreshToken } = getStoredTokens();
    if (refreshToken) {
      try {
        const refreshed = await apiLoginRefresh(refreshToken);
        setStoredTokens(refreshed.access_token, refreshed.refresh_token);
        headers['Authorization'] = `Bearer ${refreshed.access_token}`;
        const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (retryRes.ok) {
          return retryRes.json();
        }
      } catch {
        clearStoredTokens();
      }
    }
  }

  if (!response.ok) {
    let errorDetail = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}

// 1. Health check
export async function apiCheckHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  return res.json();
}

// 2. Hospital Registration
export interface HospitalRegisterPayload {
  name: string;
  registration_number: string;
  password: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_number: string;
  email: string;
  total_beds: number;
  available_beds: number;
  is_active?: boolean;
}

export interface HospitalResponseDTO {
  id: string;
  name: string;
  registration_number: string;
  address: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  available_beds: number;
  is_active: boolean;
  availability_updated_at?: string;
}

export async function apiRegisterHospital(payload: HospitalRegisterPayload): Promise<HospitalResponseDTO> {
  return apiRequest<HospitalResponseDTO>('/hospitals/register', {
    method: 'POST',
    body: JSON.stringify({
      is_active: true,
      ...payload,
    }),
  });
}

// 3. Hospital Login
export interface HospitalLoginPayload {
  registration_number: string;
  password: string;
}

export interface TokenResponseDTO {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function apiLoginHospital(payload: HospitalLoginPayload): Promise<TokenResponseDTO> {
  return apiRequest<TokenResponseDTO>('/hospitals/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 4. Token Refresh
export async function apiLoginRefresh(refreshToken: string): Promise<TokenResponseDTO> {
  const res = await fetch(`${API_BASE_URL}/hospitals/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error('Refresh token invalid or expired');
  return res.json();
}

// 5. Public Hospital List
export interface PublicHospitalDTO {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export async function apiGetPublicHospitals(): Promise<PublicHospitalDTO[]> {
  return apiRequest<PublicHospitalDTO[]>('/hospitals/public');
}

// 6. Get All Hospitals (Authed)
export async function apiGetAllHospitals(): Promise<HospitalResponseDTO[]> {
  return apiRequest<HospitalResponseDTO[]>('/hospitals/');
}

// 7. Get Single Hospital
export async function apiGetHospitalById(hospitalId: string): Promise<HospitalResponseDTO> {
  return apiRequest<HospitalResponseDTO>(`/hospitals/${hospitalId}`);
}

// 8. Update Availability (Authed)
export async function apiUpdateHospitalAvailability(
  hospitalId: string,
  totalBeds: number,
  availableBeds: number
): Promise<HospitalResponseDTO> {
  return apiRequest<HospitalResponseDTO>(`/hospitals/${hospitalId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({
      total_beds: totalBeds,
      available_beds: availableBeds,
    }),
  });
}

// 9. Hospital Operational Data
export interface DoctorDTO {
  doctor_id: string;
  name: string;
  specialization: string;
  is_available: boolean;
}

export interface HospitalDataCreateDTO {
  hospital_id: string;
  doctors: DoctorDTO[];
  general_beds_total: number;
  general_beds_available: number;
  icu_beds_total: number;
  icu_beds_available: number;
  ventilators_total: number;
  ventilators_available: number;
  oxygen_cylinders: number;
  doctors_total: number;
  doctors_available: number;
  triage_status: 'NORMAL' | 'ELEVATED' | 'RUSH' | 'DIVERT';
  notes?: string;
}

export interface HospitalDataResponseDTO extends HospitalDataCreateDTO {
  id: string;
  created_at: string;
}

export async function apiCreateHospitalData(payload: HospitalDataCreateDTO): Promise<HospitalDataResponseDTO> {
  return apiRequest<HospitalDataResponseDTO>('/hospitals-data/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 10. Get Latest Operational Data for Hospital
export async function apiGetLatestHospitalData(hospitalId: string): Promise<HospitalDataResponseDTO | null> {
  try {
    return await apiRequest<HospitalDataResponseDTO>(`/hospitals-data/hospital/${hospitalId}/latest`);
  } catch (err: any) {
    if (err.message?.includes('404')) return null;
    throw err;
  }
}

// 11. Get Operational History
export async function apiGetHospitalDataHistory(
  hospitalId: string,
  limit = 20
): Promise<HospitalDataResponseDTO[]> {
  return apiRequest<HospitalDataResponseDTO[]>(`/hospitals-data/hospital/${hospitalId}/history?limit=${limit}`);
}
