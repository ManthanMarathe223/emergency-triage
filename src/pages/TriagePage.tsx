import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Box, Activity, Building2 } from 'lucide-react';
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
        `A hospital's status updated in real time. Top recommendation is now ${name}${
          ranked[0].suitable ? '' : ' (closest partial match)'
        }.`
      );
      setSelectedId(topId);
    }
    prev.current = { top: topId, key: triageKey };
  }, [topId, triageKey, ranked, chat]);

  return (
    <div className="grid gap-4 p-4 lg:h-full lg:grid-cols-[minmax(380px,5fr)_7fr] lg:p-5">
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

      {/* Right Column: Terrain Map & Hospital Capability Console */}
      <div className="flex min-h-0 flex-col gap-3">
        {/* Map Control Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-primary flex items-center gap-1.5">
              <Activity size={16} className="text-blue-600 dark:text-blue-400" /> Dispatch Telemetry
            </span>
            <Badge variant="signal">
              <Building2 size={12} /> {hospitals.length} Facilities Active
            </Badge>
          </div>

          {/* Visualization Mode Toggle */}
          <div className="flex rounded-xl bg-surface-elevated p-1 border border-app">
            <button
              onClick={() => setMapMode('terrain')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                mapMode === 'terrain'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <MapIcon size={13} /> Terrain Map
            </button>
            <button
              onClick={() => setMapMode('3d')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                mapMode === '3d'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Box size={13} /> 3D City View
            </button>
          </div>
        </div>

        {/* Map Viewport Container */}
        <div className="h-[420px] shrink-0 lg:h-[52%] transition-all">
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
