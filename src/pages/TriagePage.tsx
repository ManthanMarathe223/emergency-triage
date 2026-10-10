import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Box, Sparkles, Building2 } from 'lucide-react';
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
