import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Box, Sparkles, Building2, AlertCircle, Loader2, Info } from 'lucide-react';
import { ChatPanel } from '../components/ChatPanel';
import { HospitalList } from '../components/HospitalList';
import { Scene3D } from '../components/Scene3D';
import { TerrainMap } from '../components/TerrainMap';
import { useChat } from '../hooks/useChat';
import { rankHospitals } from '../lib/ranking';
import { useHospitals, useSession } from '../store/hospitals';
import type { FacilityKey } from '../types';
import { Badge } from '../components/ui';

const DEFAULT_REQUIRED: FacilityKey[] = ['emergency'];

type MapVisualizationMode = 'terrain' | '3d';

export function TriagePage() {
  const hospitals = useHospitals((s) => s.hospitals);
  const scope = useHospitals((s) => s.scope);
  const loading = useHospitals((s) => s.loading);
  const error = useHospitals((s) => s.error);
  const origin = useSession((s) => s.origin);
  const chat = useChat();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapVisualizationMode>('terrain');

  const required = chat.triage?.required ?? DEFAULT_REQUIRED;
  const ranked = useMemo(() => rankHospitals(hospitals, origin, required), [hospitals, origin, required]);
  const triageKey = chat.triage ? `${chat.triage.severity}:${chat.triage.required.join(',')}` : '';
  const topId = ranked[0]?.hospital.id;

  // Focus recommended hospital on new triage result
  useEffect(() => {
    if (triageKey) setSelectedId(topId ?? null);
  }, [triageKey, topId]);

  // Dynamic re-routing on real-time portal status changes
  const prev = useRef({ top: topId, key: triageKey });
  useEffect(() => {
    const p = prev.current;
    if (triageKey && p.key === triageKey && p.top && topId && p.top !== topId) {
      const name = ranked[0].hospital.name;
      chat.pushBot(
        `A hospital's status just updated in real time. The top recommendation is now ${name}${
          ranked[0].suitable ? '' : ' (closest partial match)'
        }.`,
      );
      setSelectedId(topId);
    }
    prev.current = { top: topId, key: triageKey };
  }, [topId, triageKey, ranked, chat]);

  return (
    <div className="grid gap-4 p-4 lg:h-full lg:grid-cols-[minmax(400px,5fr)_7fr] lg:p-5">
      {/* Left Column: Triage Assistant & Clinical Reasoning */}
      <div className="min-h-0 lg:h-full">
        <ChatPanel
          messages={chat.messages}
          thinking={chat.thinking}
          patient={chat.patient}
          triage={chat.triage}
          ranked={ranked}
          onSend={chat.send}
          onSelect={setSelectedId}
        />
      </div>

      {/* Right Column: High-Impact Real Terrain & 3D Hospital Map Console */}
      <div className="flex min-h-0 flex-col gap-3">
        {/* Data status */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-300 ring-1 ring-red-500/30">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        {loading && hospitals.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
            <Loader2 size={14} className="animate-spin" /> Loading hospitals from the database…
          </div>
        )}
        {!loading && !error && hospitals.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 ring-1 ring-white/10">
            <Info size={14} className="shrink-0" /> No hospitals are registered yet. Register one to see it here.
          </div>
        )}
        {scope === 'public' && hospitals.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-warn/10 px-3 py-2 text-xs text-warn ring-1 ring-warn/30">
            <Info size={14} className="shrink-0" /> Showing hospital locations only. Bed, ICU and doctor availability needs a staff sign-in, so rankings are limited.
          </div>
        )}

        {/* Map Control Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles size={16} className="text-signal" /> Emergency Dispatch Telemetry
            </span>
            <Badge variant="signal">
              <Building2 size={12} /> {hospitals.length} Hospitals Live
            </Badge>
          </div>

          {/* Visualization Mode Toggle */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 ring-1 ring-inset ring-white/15 backdrop-blur-md">
            <button
              onClick={() => setMapMode('terrain')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mapMode === 'terrain'
                  ? 'bg-signal text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon size={14} /> Real Google Terrain Map
            </button>
            <button
              onClick={() => setMapMode('3d')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mapMode === '3d'
                  ? 'bg-signal text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box size={14} /> 3D Architectural Scene
            </button>
          </div>
        </div>

        {/* High-Impact Full-Featured Map Viewport */}
        <div className="h-[460px] shrink-0 lg:h-[54%] transition-all">
          {mapMode === 'terrain' ? (
            <TerrainMap
              origin={origin}
              ranked={ranked}
              selectedId={selectedId}
              onSelect={setSelectedId}
              triageActive={!!chat.triage}
            />
          ) : (
            <Scene3D
              origin={origin}
              ranked={ranked}
              selectedId={selectedId}
              onSelect={setSelectedId}
              triageActive={!!chat.triage}
            />
          )}
        </div>

        {/* Ranked Hospital Capability List */}
        <div className="min-h-0 flex-1">
          <HospitalList
            ranked={ranked}
            required={required}
            triageActive={!!chat.triage}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}
