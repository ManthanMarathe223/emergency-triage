import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  HeartPulse,
  BedDouble,
  Wind,
  Siren,
  Droplets,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  Compass,
} from 'lucide-react';
import { useHospitals, useSession } from '../store/hospitals';
import { useAuth } from '../store/auth';
import type { Capability, Doctor, Hospital, Room, Specialty } from '../types';
import { uid } from '../lib/util';
import { Button } from '../components/ui';

const PRESET_LOCATIONS = [
  { name: 'Hinjewadi Tech Park', lat: 18.5913, lng: 73.7389, area: 'Hinjewadi' },
  { name: 'Baner Medical Hub', lat: 18.559, lng: 73.7868, area: 'Baner' },
  { name: 'Bhosari Industrial Area', lat: 18.6272, lng: 73.8447, area: 'Bhosari' },
  { name: 'Wakad Express Corridor', lat: 18.5989, lng: 73.7615, area: 'Wakad' },
];

export function RegisterHospitalPage() {
  const navigate = useNavigate();
  const addHospital = useHospitals((s) => s.addHospital);
  const registerAccount = useAuth((s) => s.registerAccount);
  const sessionOrigin = useSession((s) => s.origin);

  // Form State
  const [name, setName] = useState('');
  const [area, setArea] = useState('Hinjewadi');
  const [phone, setPhone] = useState('+91 20 5550 9900');
  const [lat, setLat] = useState(18.5913);
  const [lng, setLng] = useState(73.7389);

  // Capacities
  const [generalBedsTotal, setGeneralBedsTotal] = useState(120);
  const [generalBedsAvail, setGeneralBedsAvail] = useState(34);
  const [icuTotal, setIcuTotal] = useState(20);
  const [icuAvail, setIcuAvail] = useState(6);
  const [ventsTotal, setVentsTotal] = useState(12);
  const [ventsAvail, setVentsAvail] = useState(5);
  const [erBaysTotal, setErBaysTotal] = useState(12);
  const [erBaysAvail, setErBaysAvail] = useState(5);
  const [bloodUnits, setBloodUnits] = useState(48);

  // Capabilities
  const [facilities, setFacilities] = useState<Record<Capability, boolean>>({
    trauma: true,
    cardiac: true,
    neuro: false,
    burn: false,
  });

  // Admin Credentials
  const [adminName, setAdminName] = useState('Dr. Sanjay Patil');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('password123');

  // Status & Success Feedback
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredHospitalId, setRegisteredHospitalId] = useState('');

  const toggleFacility = (cap: Capability) => {
    setFacilities((prev) => ({ ...prev, [cap]: !prev[cap] }));
  };

  const handleApplyPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setLat(preset.lat);
    setLng(preset.lng);
    setArea(preset.area);
  };

  const handleUseCurrentGps = () => {
    setLat(Number(sessionOrigin.lat.toFixed(4)));
    setLng(Number(sessionOrigin.lng.toFixed(4)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const hospitalId = `h-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24)}-${Date.now().toString().slice(-4)}`;
    const effectiveEmail = adminEmail.trim() || `dispatch@${hospitalId}.org`;

    // Generate starter doctors based on selected specialties
    const doctors: Doctor[] = [
      { id: uid(), name: adminName, specialty: 'Emergency Physician' as Specialty, onDuty: true },
    ];
    if (facilities.cardiac) {
      doctors.push({ id: uid(), name: 'Dr. Vivek Mehra', specialty: 'Cardiologist' as Specialty, onDuty: true });
    }
    if (facilities.trauma) {
      doctors.push({ id: uid(), name: 'Dr. Anita Roy', specialty: 'Trauma Surgeon' as Specialty, onDuty: true });
    }
    if (facilities.neuro) {
      doctors.push({ id: uid(), name: 'Dr. K. Srinivasan', specialty: 'Neurologist' as Specialty, onDuty: true });
    }
    if (facilities.burn) {
      doctors.push({ id: uid(), name: 'Dr. Maya Kulkarni', specialty: 'Burn Specialist' as Specialty, onDuty: true });
    }

    // Generate standard rooms
    const rooms: Room[] = [
      { id: 'ER-1', label: 'ER Bay 1', type: 'ER', status: 'available' },
      { id: 'ER-2', label: 'ER Bay 2', type: 'ER', status: 'available' },
      { id: 'ICU-1', label: 'ICU Bed 1', type: 'ICU', status: 'available' },
      { id: 'ICU-2', label: 'ICU Bed 2', type: 'ICU', status: 'occupied' },
      { id: 'OT-1', label: 'Operating Theatre 1', type: 'OT', status: 'available' },
    ];

    const newHospital: Hospital = {
      id: hospitalId,
      name: name.trim(),
      area: area.trim(),
      phone: phone.trim(),
      email: effectiveEmail,
      adminName: adminName.trim(),
      registeredOnline: true,
      buildingHeight: 2.2,
      lat,
      lng,
      status: 'open',
      loadPct: 45,
      beds: { total: generalBedsTotal, available: generalBedsAvail },
      icu: { total: icuTotal, available: icuAvail },
      ventilators: { total: ventsTotal, available: ventsAvail },
      erBays: { total: erBaysTotal, available: erBaysAvail },
      bloodUnits,
      facilities,
      doctors,
      rooms,
      updatedAt: Date.now(),
    };

    // Save to Hospital registry
    addHospital(newHospital);

    // Create auth account
    registerAccount({
      id: `acc-${hospitalId}`,
      hospitalId,
      hospitalName: newHospital.name,
      email: effectiveEmail,
      password: password || 'password123',
      adminName: adminName.trim(),
      role: 'admin',
      createdAt: Date.now(),
    });

    setRegisteredHospitalId(hospitalId);
    setIsSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      {/* Top Banner */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-signal/10 px-4 py-1.5 text-xs font-semibold text-signal ring-1 ring-inset ring-signal/25">
          <Sparkles size={14} /> Hospital Enrollment & Live Network Registration
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
          Register Hospital Facility
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Connect your medical center to the real-time emergency triage coordination engine. Once registered, your facility will appear instantly on the 3D map and receive prioritized emergency re-routing.
        </p>
      </div>

      {isSubmitted ? (
        <div className="glass mx-auto max-w-xl rounded-3xl p-8 text-center ring-1 ring-ok/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ok/15 text-ok shadow-lg">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-white">Hospital Successfully Enrolled!</h2>
          <p className="mt-2 text-sm text-slate-300">
            <strong>{name}</strong> is now live in the triage dispatch system. Real-time telemetry, 3D architectural marker, and ICU capacities have been published.
          </p>

          <div className="mt-6 rounded-2xl bg-black/40 p-4 text-left text-xs space-y-2 text-slate-300">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400">Facility ID:</span>
              <span className="font-mono text-signal">{registeredHospitalId}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400">Admin Email:</span>
              <span className="font-medium text-white">{adminEmail || `dispatch@${registeredHospitalId}.org`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Default Password:</span>
              <span className="font-mono text-ok">{password}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              className="bg-signal text-slate-950 hover:bg-signal/90"
              onClick={() => navigate('/portal')}
            >
              <Building2 size={16} /> Open Hospital Live Portal
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
            >
              <ArrowRight size={16} /> View on Triage 3D Map
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Facility Identity */}
          <div className="glass rounded-3xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-white">Facility Identity & Contact</h2>
                <p className="text-xs text-slate-400">Official medical center name, location district and emergency hotline</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Hospital Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Apex Multispeciality & Trauma Institute"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Area / Zone *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Hinjewadi Phase 1"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Emergency Phone Helpline *
                </label>
                <input
                  required
                  type="text"
                  placeholder="+91 20 5550 9900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Geographic Coordinates & Map Placement */}
          <div className="glass rounded-3xl p-6 ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal/15 text-signal">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-white">Geographic Location Coordinates</h2>
                  <p className="text-xs text-slate-400">Used for accurate routing, distance scoring, and 3D architectural placement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentGps}
                className="hidden items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/10 sm:flex"
              >
                <Compass size={14} className="text-signal" /> Use GPS Location
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Latitude (North)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm font-mono text-white ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Longitude (East)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm font-mono text-white ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs text-slate-400">Quick Pune / PCMC Presets:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_LOCATIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-lg bg-white/6 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-signal/20 hover:text-signal"
                  >
                    📍 {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Live Capacities */}
          <div className="glass rounded-3xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ok/15 text-ok">
                <BedDouble size={18} />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-white">Emergency Resources & Live Beds</h2>
                <p className="text-xs text-slate-400">Total capacity and currently available units for emergency intake</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* General Beds */}
              <div className="rounded-2xl bg-black/30 p-3.5 ring-1 ring-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <BedDouble size={15} className="text-brand-soft" /> General Beds
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Available</span>
                    <input
                      type="number"
                      min={0}
                      value={generalBedsAvail}
                      onChange={(e) => setGeneralBedsAvail(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1 text-xs text-ok ring-1 ring-white/10"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Total</span>
                    <input
                      type="number"
                      min={1}
                      value={generalBedsTotal}
                      onChange={(e) => setGeneralBedsTotal(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1 text-xs text-white ring-1 ring-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* ICU */}
              <div className="rounded-2xl bg-black/30 p-3.5 ring-1 ring-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <HeartPulse size={15} className="text-signal" /> ICU Beds
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Available</span>
                    <input
                      type="number"
                      min={0}
                      value={icuAvail}
                      onChange={(e) => setIcuAvail(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1 text-xs text-signal ring-1 ring-white/10"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Total</span>
                    <input
                      type="number"
                      min={1}
                      value={icuTotal}
                      onChange={(e) => setIcuTotal(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1 text-xs text-white ring-1 ring-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Ventilators */}
              <div className="rounded-2xl bg-black/30 p-3.5 ring-1 ring-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Wind size={15} className="text-ok" /> Ventilators
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Available</span>
                    <input
                      type="number"
                      min={0}
                      value={ventsAvail}
                      onChange={(e) => setVentsAvail(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1 text-xs text-ok ring-1 ring-white/10"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Total</span>
                    <input
                      type="number"
                      min={1}
                      value={ventsTotal}
                      onChange={(e) => setVentsTotal(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1 text-xs text-white ring-1 ring-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* ER Bays */}
              <div className="rounded-2xl bg-black/30 p-3.5 ring-1 ring-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Siren size={15} className="text-warn" /> ER Bays
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Available</span>
                    <input
                      type="number"
                      min={0}
                      value={erBaysAvail}
                      onChange={(e) => setErBaysAvail(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1 text-xs text-warn ring-1 ring-white/10"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400">Total</span>
                    <input
                      type="number"
                      min={1}
                      value={erBaysTotal}
                      onChange={(e) => setErBaysTotal(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg bg-black/40 px-2 py-1 text-xs text-white ring-1 ring-white/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Droplets size={16} className="text-brand-soft" /> Blood Units in Stock
              </div>
              <input
                type="number"
                min={0}
                value={bloodUnits}
                onChange={(e) => setBloodUnits(parseInt(e.target.value) || 0)}
                className="w-24 rounded-lg bg-black/40 px-2 py-1 text-right text-xs font-bold text-white ring-1 ring-white/10"
              />
            </div>
          </div>

          {/* Section 4: Specialist Centers */}
          <div className="glass rounded-3xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warn/15 text-warn">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-white">Specialized Clinical Units</h2>
                <p className="text-xs text-slate-400">Toggle departments supported by your medical staff</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl bg-black/30 p-3 ring-1 ring-white/5 hover:bg-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Trauma & Resuscitation Unit</div>
                  <div className="text-xs text-slate-400">Polytrauma, crash resuscitation & emergency surgical theatre</div>
                </div>
                <input
                  type="checkbox"
                  checked={facilities.trauma}
                  onChange={() => toggleFacility('trauma')}
                  className="h-4 w-4 rounded accent-signal"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl bg-black/30 p-3 ring-1 ring-white/5 hover:bg-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Cardiac Catheterization Lab</div>
                  <div className="text-xs text-slate-400">STEMI, acute coronary syndrome, 24/7 angioplasty</div>
                </div>
                <input
                  type="checkbox"
                  checked={facilities.cardiac}
                  onChange={() => toggleFacility('cardiac')}
                  className="h-4 w-4 rounded accent-signal"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl bg-black/30 p-3 ring-1 ring-white/5 hover:bg-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Neurological & Stroke Unit</div>
                  <div className="text-xs text-slate-400">Ischemic stroke thrombolysis & neuro-ICU care</div>
                </div>
                <input
                  type="checkbox"
                  checked={facilities.neuro}
                  onChange={() => toggleFacility('neuro')}
                  className="h-4 w-4 rounded accent-signal"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl bg-black/30 p-3 ring-1 ring-white/5 hover:bg-white/5">
                <div>
                  <div className="text-sm font-semibold text-white">Burn Critical Care Center</div>
                  <div className="text-xs text-slate-400">Specialized burn dressing and sterile burn ICU</div>
                </div>
                <input
                  type="checkbox"
                  checked={facilities.burn}
                  onChange={() => toggleFacility('burn')}
                  className="h-4 w-4 rounded accent-signal"
                />
              </label>
            </div>
          </div>

          {/* Section 5: Hospital Admin Credentials */}
          <div className="glass rounded-3xl p-6 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                <Lock size={18} />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-white">Hospital Admin Account Setup</h2>
                <p className="text-xs text-slate-400">Credentials used by your staff to log in and update bed counts in real time</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <User size={13} /> Admin In-Charge Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="Dr. Sanjay Patil"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Mail size={13} /> Official Admin Email
                </label>
                <input
                  type="email"
                  placeholder="admin@hospital.org"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Lock size={13} /> Admin Access Password
                </label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 ring-1 ring-inset ring-white/15 focus:ring-2 focus:ring-signal focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-signal hover:underline">
                Log into Hospital Portal
              </Link>
            </p>
            <div className="flex w-full gap-3 sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-signal font-semibold text-slate-950 shadow-lg shadow-signal/20 hover:bg-signal/90 sm:flex-none"
              >
                Complete Registration & Enroll <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
