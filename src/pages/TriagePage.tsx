import { useEffect, useMemo, useRef, useState } from 'react';
import { ChatPanel } from '../components/ChatPanel';
import { HospitalList } from '../components/HospitalList';
import { Scene3D } from '../components/Scene3D';
import { useChat } from '../hooks/useChat';
import { rankHospitals } from '../lib/ranking';
import { useHospitals, useSession } from '../store/hospitals';
import type { FacilityKey } from '../types';

const DEFAULT_REQUIRED: FacilityKey[] = ['emergency'];

export function TriagePage() {
  const hospitals = useHospitals((s) => s.hospitals);
  const origin = useSession((s) => s.origin);
  const chat = useChat();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const required = chat.triage?.required ?? DEFAULT_REQUIRED;
  const ranked = useMemo(() => rankHospitals(hospitals, origin, required), [hospitals, origin, required]);
  const triageKey = chat.triage ? `${chat.triage.severity}:${chat.triage.required.join(',')}` : '';
  const topId = ranked[0]?.hospital.id;

  // New triage result: focus the recommended hospital.
  useEffect(() => { if (triageKey) setSelectedId(topId ?? null); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [triageKey]);

  // Dynamic re-routing: a hospital edit in the portal changed the best choice for the same patient.
  const prev = useRef({ top: topId, key: triageKey });
  useEffect(() => {
    const p = prev.current;
    if (triageKey && p.key === triageKey && p.top && topId && p.top !== topId) {
      const name = ranked[0].hospital.name;
      chat.pushBot(`A hospital's status just changed. The recommendation is now ${name}${ranked[0].suitable ? '' : ' (closest partial match)'}.`);
      setSelectedId(topId);
    }
    prev.current = { top: topId, key: triageKey };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topId, triageKey]);

  return (
    <div className="grid gap-4 p-4 lg:h-full lg:grid-cols-[minmax(380px,5fr)_7fr] lg:p-5">
      <div className="min-h-0 lg:h-full">
        <ChatPanel messages={chat.messages} thinking={chat.thinking} patient={chat.patient} triage={chat.triage} ranked={ranked} onSend={chat.send} onSelect={setSelectedId} />
      </div>
      <div className="flex min-h-0 flex-col gap-4">
        <div className="h-[320px] shrink-0 lg:h-[42%]">
          <Scene3D origin={origin} ranked={ranked} selectedId={selectedId} onSelect={setSelectedId} triageActive={!!chat.triage} />
        </div>
        <div className="min-h-0 flex-1">
          <HospitalList ranked={ranked} required={required} triageActive={!!chat.triage} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>
    </div>
  );
}
