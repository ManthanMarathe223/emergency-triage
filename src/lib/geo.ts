import type { LatLng } from '../types';

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Straight-line fallback. Swap for Google Maps Directions API (via your backend) for real road ETA. */
export function etaMinutes(km: number): number {
  const roadKm = km * 1.35;
  return Math.max(2, Math.round((roadKm / 32) * 60));
}

/** Local km offsets (east, north) of `p` relative to `origin`, used by the 3D board. */
export function toLocalKm(origin: LatLng, p: LatLng) {
  return { x: (p.lng - origin.lng) * 111.32 * Math.cos(rad(origin.lat)), z: -(p.lat - origin.lat) * 110.57 };
}
