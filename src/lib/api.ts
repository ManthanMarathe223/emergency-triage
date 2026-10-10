/**
 * Backend client for https://ai-linklife-backend.vercel.app
 *  - access + refresh tokens are stored in localStorage
 *  - protected calls send `Authorization: Bearer <access_token>`
 *  - on 401 the refresh token is exchanged once (POST /hospitals/refresh) and the call is retried
 *  - if refresh fails the tokens are cleared and an `etriage:logout` event is fired
 */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://ai-linklife-backend.vercel.app').replace(/\/+$/, '');
const TOKEN_KEY = 'etriage-tokens-v2';
export const LOGOUT_EVENT = 'etriage:logout';

/* ---------- DTOs (mirror the backend) ---------- */

export interface TokenResponse { access_token: string; refresh_token: string; token_type: string; expires_in: number }

export interface HospitalRegisterBody {
  name: string;
  registration_number: string;
  password: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_number?: string;
  email?: string;
  total_beds: number;
  available_beds: number;
  is_active?: boolean;
}

export interface HospitalDTO {
  id: string;
  name: string;
  registration_number: string;
  address: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  available_beds: number;
  is_active: boolean;
  availability_updated_at?: string | null;
  contact_number?: string | null;
  email?: string | null;
}

export interface PublicHospitalDTO { id: string; name: string; address: string; latitude: number; longitude: number }

export interface DoctorDTO { doctor_id: string; name: string; specialization: string; is_available: boolean }

export interface HospitalDataBody {
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
  triage_status: string;
  notes?: string;
}

export type HospitalDataPatch = Partial<Omit<HospitalDataBody, 'hospital_id'>>;

export interface HospitalDataDTO extends HospitalDataBody {
  id?: string;
  _id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  recorded_at?: string | null;
}

/* ---------- token storage ---------- */

interface Tokens { access: string; refresh: string }

export function getTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}
export function setTokens(t: TokenResponse) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ access: t.access_token, refresh: t.refresh_token }));
}
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

/* ---------- errors ---------- */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function describe(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: (string | number)[]; msg?: string }) => `${(d.loc ?? []).filter((x) => x !== 'body').join('.')}: ${d.msg ?? 'invalid'}`)
      .join('; ');
  }
  if (status === 401) return 'Session expired or invalid credentials';
  if (status === 409) return 'Already exists';
  return `Request failed (${status})`;
}

/* ---------- core request ---------- */

function toggleSlash(path: string): string {
  const [p, q] = path.split('?');
  const flipped = p.endsWith('/') ? p.slice(0, -1) : `${p}/`;
  return q ? `${flipped}?${q}` : flipped;
}

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const t = getTokens();
  if (!t) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${BASE}/hospitals/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: t.refresh }),
        });
        if (!res.ok) return false;
        setTokens((await res.json()) as TokenResponse);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

interface Opts { method?: string; body?: unknown; auth?: boolean }

async function request<T>(path: string, { method = 'GET', body, auth = false }: Opts = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = getTokens();
    if (!t) throw new ApiError(401, 'Not signed in');
    headers.Authorization = `Bearer ${t.access}`;
  }

  const send = (p: string) => fetch(`${BASE}${p}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });

  let res: Response;
  try {
    res = await send(path);
  } catch {
    // FastAPI redirects /x <-> /x/ and a redirect breaks CORS preflight, so retry the other form once.
    try {
      res = await send(toggleSlash(path));
    } catch {
      throw new ApiError(
        0,
        `Cannot reach ${BASE}${path.split('?')[0]}. Open DevTools > Network: if the OPTIONS request fails, the backend CORS config must allow this origin, the Authorization header and the PATCH method.`,
      );
    }
  }

  if (res.status === 401 && auth && !retried) {
    if (await refreshTokens()) return request<T>(path, { method, body, auth }, true);
    clearTokens();
    window.dispatchEvent(new Event(LOGOUT_EVENT));
  }

  const data: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, describe(res.status, data));
  return data as T;
}

/* ---------- endpoints ---------- */

export const api = {
  health: () => request<{ status: string }>('/health'),

  register: (b: HospitalRegisterBody) => request<HospitalDTO>('/hospitals/register', { method: 'POST', body: b }),
  login: (registration_number: string, password: string) =>
    request<TokenResponse>('/hospitals/login', { method: 'POST', body: { registration_number, password } }),
  publicHospitals: () => request<PublicHospitalDTO[]>('/hospitals/public'),

  listHospitals: () => request<HospitalDTO[]>('/hospitals/', { auth: true }),
  updateAvailability: (id: string, total_beds: number, available_beds: number) =>
    request<HospitalDTO>(`/hospitals/${id}/availability`, { method: 'PATCH', body: { total_beds, available_beds }, auth: true }),

  createData: (b: HospitalDataBody) => request<HospitalDataDTO>('/hospitals-data/', { method: 'POST', body: b, auth: true }),
  listData: (limit = 500) => request<HospitalDataDTO[]>(`/hospitals-data/?limit=${limit}`, { auth: true }),
  patchData: (dataId: string, patch: HospitalDataPatch) =>
    request<HospitalDataDTO>(`/hospitals-data/${dataId}`, { method: 'PATCH', body: patch, auth: true }),
  historyFor: (hospitalId: string, limit = 20) =>
    request<HospitalDataDTO[]>(`/hospitals-data/hospital/${hospitalId}/history?limit=${limit}`, { auth: true }),
};
