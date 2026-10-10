import type { Doctor, Hospital, LatLng, Room, RoomStatus, RoomType, Specialty } from '../types';

/** Default patient location: Akurdi, Pimpri-Chinchwad. Replace via "Use my location". */
export const DEFAULT_ORIGIN: LatLng = { lat: 18.6489, lng: 73.7716 };

const doc = (id: string, name: string, specialty: Specialty, onDuty = true): Doctor => ({ id, name, specialty, onDuty });
const rooms = (spec: [RoomType, number, RoomStatus[]][]): Room[] =>
  spec.flatMap(([type, n, st]) =>
    Array.from({ length: n }, (_, i) => ({ id: `${type}-${i + 1}`, label: `${type} ${i + 1}`, type, status: st[i % st.length] })),
  );
const now = Date.now();

/** Simulated hospitals for the prototype. Not real facilities or real data. */
export const SEED_HOSPITALS: Hospital[] = [
  {
    id: 'h-sanjeevani', name: 'Sanjeevani Heart Institute', area: 'Nigdi', phone: '+91 20 5550 0101',
    lat: 18.66, lng: 73.774, status: 'busy', loadPct: 82,
    beds: { total: 60, available: 6 }, icu: { total: 12, available: 0 }, ventilators: { total: 8, available: 0 },
    erBays: { total: 8, available: 2 }, bloodUnits: 18,
    facilities: { trauma: false, cardiac: true, neuro: false, burn: false },
    doctors: [doc('d1', 'Dr. R. Kulkarni', 'Cardiologist'), doc('d2', 'Dr. S. Nair', 'Emergency Physician'), doc('d3', 'Dr. P. Joshi', 'Intensivist', false)],
    rooms: rooms([['ICU', 4, ['occupied']], ['OT', 2, ['occupied', 'available']], ['ER', 4, ['occupied', 'available']]]), updatedAt: now,
  },
  {
    id: 'h-lifeline', name: 'Lifeline Multispeciality', area: 'Chinchwad', phone: '+91 20 5550 0102',
    lat: 18.6298, lng: 73.7997, status: 'open', loadPct: 55,
    beds: { total: 140, available: 38 }, icu: { total: 24, available: 5 }, ventilators: { total: 16, available: 4 },
    erBays: { total: 14, available: 6 }, bloodUnits: 64,
    facilities: { trauma: true, cardiac: true, neuro: true, burn: false },
    doctors: [doc('d1', 'Dr. A. Deshmukh', 'Cardiologist'), doc('d2', 'Dr. M. Iyer', 'Trauma Surgeon'), doc('d3', 'Dr. V. Pawar', 'Neurologist'), doc('d4', 'Dr. K. Shaikh', 'Intensivist'), doc('d5', 'Dr. T. Gokhale', 'Emergency Physician')],
    rooms: rooms([['ICU', 6, ['available', 'occupied', 'occupied']], ['OT', 4, ['available', 'occupied']], ['ER', 6, ['available', 'occupied', 'cleaning']]]), updatedAt: now,
  },
  {
    id: 'h-metro', name: 'Metro Neuro & Trauma Centre', area: 'Pimpri', phone: '+91 20 5550 0103',
    lat: 18.6279, lng: 73.8131, status: 'open', loadPct: 40,
    beds: { total: 90, available: 41 }, icu: { total: 18, available: 7 }, ventilators: { total: 12, available: 6 },
    erBays: { total: 10, available: 5 }, bloodUnits: 40,
    facilities: { trauma: true, cardiac: false, neuro: true, burn: false },
    doctors: [doc('d1', 'Dr. N. Bhosale', 'Neurologist'), doc('d2', 'Dr. S. Patil', 'Trauma Surgeon'), doc('d3', 'Dr. L. D’Souza', 'Intensivist'), doc('d4', 'Dr. H. Khan', 'Pulmonologist')],
    rooms: rooms([['ICU', 5, ['available', 'occupied']], ['OT', 3, ['available']], ['ER', 5, ['available', 'cleaning']]]), updatedAt: now,
  },
  {
    id: 'h-citycare', name: 'CityCare General Hospital', area: 'Akurdi', phone: '+91 20 5550 0104',
    lat: 18.646, lng: 73.765, status: 'open', loadPct: 35,
    beds: { total: 50, available: 22 }, icu: { total: 0, available: 0 }, ventilators: { total: 0, available: 0 },
    erBays: { total: 6, available: 4 }, bloodUnits: 9,
    facilities: { trauma: false, cardiac: false, neuro: false, burn: false },
    doctors: [doc('d1', 'Dr. B. More', 'Emergency Physician'), doc('d2', 'Dr. C. Rane', 'General Surgeon')],
    rooms: rooms([['OT', 1, ['available']], ['ER', 4, ['available', 'occupied']], ['Ward', 6, ['available', 'occupied']]]), updatedAt: now,
  },
  {
    id: 'h-apex', name: 'Apex Burn & Plastic Care', area: 'Wakad', phone: '+91 20 5550 0105',
    lat: 18.5989, lng: 73.7615, status: 'busy', loadPct: 70,
    beds: { total: 70, available: 14 }, icu: { total: 10, available: 2 }, ventilators: { total: 6, available: 2 },
    erBays: { total: 8, available: 3 }, bloodUnits: 28,
    facilities: { trauma: true, cardiac: false, neuro: false, burn: true },
    doctors: [doc('d1', 'Dr. G. Menon', 'Burn Specialist'), doc('d2', 'Dr. I. Sethi', 'Trauma Surgeon'), doc('d3', 'Dr. O. Bapat', 'Intensivist')],
    rooms: rooms([['ICU', 3, ['available', 'occupied']], ['OT', 3, ['occupied', 'available']], ['ER', 4, ['occupied', 'available']]]), updatedAt: now,
  },
];
