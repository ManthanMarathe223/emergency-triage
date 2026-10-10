import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  HeartPulse,
  BedDouble,
  Wind,
  Siren,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  Compass,
  Hash,
  Phone,
  AlertCircle,
  Loader2,
  Droplets,
  ShieldCheck,
} from 'lucide-react';
import { useHospitals, useSession } from '../store/hospitals';
import { useAuth } from '../store/auth';
import { API_BASE_URL } from '../lib/api';
import type { Capability, Doctor, Hospital, Room, Specialty } from '../types';
import { uid } from '../lib/util';
import { Button, SpotlightCard } from '../components/ui';

const PRESET_LOCATIONS = [
  { name: 'Hinjewadi Tech Park', lat: 18.5913, lng: 73.7389, area: 'Hinjewadi, Pune' },
  { name: 'Baner Medical Hub', lat: 18.559, lng: 73.7868, area: 'Baner, Pune' },
  { name: 'Bhosari Industrial Area', lat: 18.6272, lng: 73.8447, area: 'Bhosari, PCMC' },
  { name: 'Wakad Express Corridor', lat: 18.5989, lng: 73.7615, area: 'Wakad, Pune' },
];

export function RegisterHospitalPage() {
  const navigate = useNavigate();
  const addHospital = useHospitals((s) => s.addHospital);
  const registerHospitalBackend = useAuth((s) => s.registerHospitalBackend);
  const sessionOrigin = useSession((s) => s.origin);

  // Form State
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState(`REG-${Math.floor(100 + Math.random() * 900)}`);
  const [area, setArea] = useState('Hinjewadi, Pune');
  const [phone, setPhone] = useState('+91 20 5550 9900');
  const [lat, setLat] = useState(18.5913);
  const [lng, setLng] = useState(73.7389);

  // Capacities
  const [generalBedsTotal, setGeneralBedsTotal] = useState(100);
  const [generalBedsAvail, setGeneralBedsAvail] = useState(35);
  const [icuTotal, setIcuTotal] = useState(20);
  const [icuAvail, setIcuAvail] = useState(6);
  const [ventsTotal, setVentsTotal] = useState(12);
  const [ventsAvail, setVentsAvail] = useState(4);
  const [erBaysTotal, setErBaysTotal] = useState(10);
  const [erBaysAvail, setErBaysAvail] = useState(4);
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

  // Status & Error Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)));
          setLng(Number(pos.coords.longitude.toFixed(4)));
        },
        () => {
          setLat(Number(sessionOrigin.lat.toFixed(4)));
          setLng(Number(sessionOrigin.lng.toFixed(4)));
        }
      );
    } else {
      setLat(Number(sessionOrigin.lat.toFixed(4)));
      setLng(Number(sessionOrigin.lng.toFixed(4)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter the Hospital Name.');
      return;
    }
    if (!registrationNumber.trim()) {
      setErrorMessage('Please enter an official Registration Number.');
      return;
    }

    setIsSubmitting(true);

    const generatedId = `h-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}-${Date.now().toString().slice(-4)}`;
    const effectiveEmail = adminEmail.trim() || `dispatch@${generatedId}.org`;

    // 1. Send Backend API request to POST /hospitals/register
    const backendResult = await registerHospitalBackend(
      {
        name: name.trim(),
        registration_number: registrationNumber.trim(),
        password: password || 'password123',
        address: area.trim(),
        latitude: lat,
        longitude: lng,
        contact_number: phone.trim(),
        email: effectiveEmail,
        total_beds: generalBedsTotal,
        available_beds: generalBedsAvail,
        is_active: true,
      },
      adminName.trim()
    );

    const finalHospitalId = backendResult.hospitalId || generatedId;

    // 2. Build local state object
    const doctors: Doctor[] = [
      { id: uid(), name: adminName, specialty: 'Emergency Physician' as Specialty, onDuty: true },
    ];
    if (facilities.cardiac) doctors.push({ id: uid(), name: 'Dr. Vivek Mehra', specialty: 'Cardiologist' as Specialty, onDuty: true });
    if (facilities.trauma) doctors.push({ id: uid(), name: 'Dr. Anita Roy', specialty: 'Trauma Surgeon' as Specialty, onDuty: true });
    if (facilities.neuro) doctors.push({ id: uid(), name: 'Dr. K. Srinivasan', specialty: 'Neurologist' as Specialty, onDuty: true });
    if (facilities.burn) doctors.push({ id: uid(), name: 'Dr. Maya Kulkarni', specialty: 'Burn Specialist' as Specialty, onDuty: true });

    const rooms: Room[] = [
      { id: 'ER-1', label: 'ER Bay 1', type: 'ER', status: 'available' },
      { id: 'ICU-1', label: 'ICU Bed 1', type: 'ICU', status: 'available' },
      { id: 'OT-1', label: 'Operating Theatre 1', type: 'OT', status: 'available' },
    ];

    const newHospital: Hospital = {
      id: finalHospitalId,
      name: name.trim(),
      registrationNumber: registrationNumber.trim(),
      area: area.trim(),
      phone: phone.trim(),
      email: effectiveEmail,
      adminName: adminName.trim(),
      registeredOnline: true,
      lat,
      lng,
      status: 'open',
      loadPct: Math.round(((generalBedsTotal - generalBedsAvail) / Math.max(1, generalBedsTotal)) * 100),
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

    addHospital(newHospital);
    setRegisteredHospitalId(finalHospitalId);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
      {/* Top Banner */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300">
          <Sparkles size={14} /> Hospital Facility Enrollment & Registration
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">
          Register Medical Facility
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-secondary md:text-sm">
          Register your hospital into the emergency dispatch network. Once onboarded, your facility will appear instantly on the map console and accept routed emergency cases.
        </p>
      </div>

      {isSubmitted ? (
        <SpotlightCard className="mx-auto max-w-lg p-8 text-center border-emerald-300 dark:border-emerald-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-primary">Hospital Successfully Enrolled!</h2>
          <p className="mt-2 text-xs text-secondary leading-relaxed">
            <strong>{name}</strong> is now registered in the triage system and synchronized with backend API <code>{API_BASE_URL}</code>.
          </p>

          <div className="mt-5 rounded-xl border border-app bg-surface-elevated p-4 text-left text-xs space-y-2 text-primary">
            <div className="flex justify-between border-b border-app pb-2">
              <span className="text-secondary">Registration No:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{registrationNumber}</span>
            </div>
            <div className="flex justify-between border-b border-app pb-2">
              <span className="text-secondary">Facility ID:</span>
              <span className="font-mono text-secondary">{registeredHospitalId}</span>
            </div>
            <div className="flex justify-between border-b border-app pb-2">
              <span className="text-secondary">Admin Email:</span>
              <span className="font-medium text-primary">{adminEmail || `dispatch@${registeredHospitalId}.org`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Default Password:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{password}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700 py-2.5 text-xs"
              onClick={() => navigate('/portal')}
            >
              <Building2 size={15} /> Open Hospital Live Portal
            </Button>
            <Button
              variant="ghost"
              className="py-2.5 text-xs"
              onClick={() => navigate('/')}
            >
              <ArrowRight size={15} /> View on Map Console
            </Button>
          </div>
        </SpotlightCard>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle size={16} className="shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Facility Identity */}
          <div className="rounded-2xl border border-app bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-app pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-primary">Hospital Identity & Registration Details</h2>
                <p className="text-xs text-secondary">Official facility details sent to POST /hospitals/register</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-primary">
                  Hospital Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. City General Hospital"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs text-primary placeholder-muted focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Hash size={13} className="text-blue-600 dark:text-blue-400" /> Registration Number *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. CGH-001"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs font-mono text-primary placeholder-muted focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-primary">
                  Address / Zone *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 1 Main Street, Hinjewadi"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs text-primary placeholder-muted focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Phone size={13} className="text-blue-600 dark:text-blue-400" /> Emergency Contact Hotline *
                </label>
                <input
                  required
                  type="text"
                  placeholder="+91-9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs text-primary placeholder-muted focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Geographic Coordinates & Location */}
          <div className="rounded-2xl border border-app bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-app pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="font-display text-sm font-bold text-primary">Location Coordinates</h2>
                  <p className="text-xs text-secondary">Accurate GPS latitude and longitude for routing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentGps}
                className="inline-flex items-center gap-1.5 rounded-lg border border-app bg-surface-elevated px-2.5 py-1 text-xs font-medium text-secondary hover:text-primary cursor-pointer"
              >
                <Compass size={13} className="text-blue-600 dark:text-blue-400" /> Use Current GPS
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-primary">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs font-mono text-primary outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-primary">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs font-mono text-primary outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="mt-3 text-xs text-secondary">
              <span>Presets: </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PRESET_LOCATIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-lg border border-app bg-surface-elevated px-2.5 py-1 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-muted cursor-pointer"
                  >
                    📍 {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Beds & Resources */}
          <div className="rounded-2xl border border-app bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-app pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <BedDouble size={18} />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-primary">Beds & Operational Capacity</h2>
                <p className="text-xs text-secondary">Initial bed counts registered into backend schema</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* General Beds */}
              <div className="rounded-xl border border-app bg-surface-elevated p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <BedDouble size={14} className="text-blue-600 dark:text-blue-400" /> General Beds
                </div>
                <div className="mt-2.5 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-secondary">Available</span>
                    <input
                      type="number"
                      min={0}
                      value={generalBedsAvail}
                      onChange={(e) => setGeneralBedsAvail(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-app bg-surface px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-secondary">Total</span>
                    <input
                      type="number"
                      min={1}
                      value={generalBedsTotal}
                      onChange={(e) => setGeneralBedsTotal(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-app bg-surface px-2 py-1 text-xs font-bold text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* ICU */}
              <div className="rounded-xl border border-app bg-surface-elevated p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <HeartPulse size={14} className="text-blue-600 dark:text-blue-400" /> ICU Beds
                </div>
                <div className="mt-2.5 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-secondary">Available</span>
                    <input
                      type="number"
                      min={0}
                      value={icuAvail}
                      onChange={(e) => setIcuAvail(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-app bg-surface px-2 py-1 text-xs font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-secondary">Total</span>
                    <input
                      type="number"
                      min={1}
                      value={icuTotal}
                      onChange={(e) => setIcuTotal(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-app bg-surface px-2 py-1 text-xs font-bold text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Ventilators */}
              <div className="rounded-xl border border-app bg-surface-elevated p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Wind size={14} className="text-blue-600 dark:text-blue-400" /> Ventilators
                </div>
                <div className="mt-2.5 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-secondary">Available</span>
                    <input
                      type="number"
                      min={0}
                      value={ventsAvail}
                      onChange={(e) => setVentsAvail(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-app bg-surface px-2 py-1 text-xs font-bold text-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-secondary">Total</span>
                    <input
                      type="number"
                      min={1}
                      value={ventsTotal}
                      onChange={(e) => setVentsTotal(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-app bg-surface px-2 py-1 text-xs font-bold text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* ER Bays */}
              <div className="rounded-xl border border-app bg-surface-elevated p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Siren size={14} className="text-amber-600 dark:text-amber-400" /> ER Bays
                </div>
                <div className="mt-2.5 flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-secondary">Available</span>
                    <input
                      type="number"
                      min={0}
                      value={erBaysAvail}
                      onChange={(e) => setErBaysAvail(parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-app bg-surface px-2 py-1 text-xs font-bold text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-secondary">Total</span>
                    <input
                      type="number"
                      min={1}
                      value={erBaysTotal}
                      onChange={(e) => setErBaysTotal(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-app bg-surface px-2 py-1 text-xs font-bold text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between rounded-xl border border-app bg-surface-elevated p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Droplets size={15} className="text-red-600 dark:text-red-400" /> Blood Units in Reserve Stock
              </div>
              <input
                type="number"
                min={0}
                value={bloodUnits}
                onChange={(e) => setBloodUnits(parseInt(e.target.value) || 0)}
                className="w-24 rounded-lg border border-app bg-surface px-2.5 py-1 text-right text-xs font-bold text-primary"
              />
            </div>
          </div>

          {/* Specialized Units Section */}
          <div className="rounded-2xl border border-app bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-app pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-primary">Specialized Clinical Units</h2>
                <p className="text-xs text-secondary">Toggle departments supported by medical staff</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-app bg-surface-elevated p-3 hover:bg-surface-muted">
                <div>
                  <div className="text-xs font-bold text-primary">Trauma & Resuscitation Center</div>
                  <div className="text-[11px] text-secondary">Polytrauma & emergency surgery</div>
                </div>
                <input
                  type="checkbox"
                  checked={facilities.trauma}
                  onChange={() => toggleFacility('trauma')}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-app bg-surface-elevated p-3 hover:bg-surface-muted">
                <div>
                  <div className="text-xs font-bold text-primary">Cardiac Catheterization Lab</div>
                  <div className="text-[11px] text-secondary">STEMI & 24/7 angioplasty</div>
                </div>
                <input
                  type="checkbox"
                  checked={facilities.cardiac}
                  onChange={() => toggleFacility('cardiac')}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-app bg-surface-elevated p-3 hover:bg-surface-muted">
                <div>
                  <div className="text-xs font-bold text-primary">Stroke & Neuro-ICU Unit</div>
                  <div className="text-[11px] text-secondary">Ischemic stroke thrombolysis</div>
                </div>
                <input
                  type="checkbox"
                  checked={facilities.neuro}
                  onChange={() => toggleFacility('neuro')}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-app bg-surface-elevated p-3 hover:bg-surface-muted">
                <div>
                  <div className="text-xs font-bold text-primary">Burn Critical Care Center</div>
                  <div className="text-[11px] text-secondary">Sterile burn ICU & skin graft</div>
                </div>
                <input
                  type="checkbox"
                  checked={facilities.burn}
                  onChange={() => toggleFacility('burn')}
                  className="h-4 w-4 rounded accent-blue-600"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Admin Credentials */}
          <div className="rounded-2xl border border-app bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-app pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                <Lock size={18} />
              </div>
              <div>
                <h2 className="font-display text-sm font-bold text-primary">Staff Account Credentials</h2>
                <p className="text-xs text-secondary">Credentials used to log in at /hospitals/login</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                  <User size={13} className="text-blue-600 dark:text-blue-400" /> Director / Admin Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="Dr. Sanjay Patil"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs text-primary placeholder-muted focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Mail size={13} className="text-blue-600 dark:text-blue-400" /> Admin Email
                </label>
                <input
                  type="email"
                  placeholder="admin@hospital.org"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs text-primary placeholder-muted focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Lock size={13} className="text-blue-600 dark:text-blue-400" /> Password *
                </label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-app bg-surface-elevated px-3 py-2 text-xs text-primary placeholder-muted focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
            <p className="text-xs text-secondary">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Log into Hospital Portal
              </Link>
            </p>
            <div className="flex w-full gap-3 sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex-1 sm:flex-none text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 font-semibold text-white hover:bg-blue-700 sm:flex-none text-xs py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Registering with Backend...
                  </>
                ) : (
                  <>
                    Complete Registration & Enroll <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
