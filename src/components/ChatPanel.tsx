import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUp, Check, Mic, MicOff, Phone, Stethoscope, ShieldAlert, X } from 'lucide-react';
import type { ChatMessage, FacilityKey, PatientCase, RankedHospital, TriageResult } from '../types';
import { FACILITY_LABEL } from '../lib/capability';
import { whyThisHospital } from '../lib/ranking';
import { cn } from '../lib/util';
import { Button, Pill, SEVERITY } from './ui';

const SCENARIOS = [
  { title: 'Cardio-respiratory', text: 'Chest pain, difficulty breathing, SpO2 88, HR 124, 58 years' },
  { title: 'Road accident', text: 'Road accident, severe bleeding, BP 85/50, HR 132' },
  { title: 'Stroke signs', text: 'Slurred speech, face droop and one-sided weakness, 67 years' },
  { title: 'Severe burns', text: 'Severe burns from a kitchen fire, 30 years' },
  { title: 'Child seizure', text: 'Seizure and high fever, temp 39.8, 4 years' },
  { title: 'Mild case', text: 'Abdominal pain since morning, HR 88' },
];
const FOLLOW_UPS = ['Why this hospital?', 'Show other hospitals', 'Add SpO2 85', 'New patient'];

interface SpeechRec {
  lang: string; interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; start(): void; stop(): void;
}
type SpeechCtor = new () => SpeechRec;

interface Props {
  messages: ChatMessage[];
  thinking: boolean;
  patient: PatientCase;
  triage: TriageResult | null;
  ranked: RankedHospital[];
  onSend: (text: string) => void;
  onSelect: (id: string) => void;
}

export function ChatPanel({ messages, thinking, patient, triage, ranked, onSend, onSelect }: Props) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const started = messages.length > 1;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, thinking]);

  const submit = (v = text) => { if (!v.trim()) return; onSend(v); setText(''); };

  const toggleMic = () => {
    const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new Ctor();
    rec.lang = 'en-IN'; rec.interimResults = false;
    rec.onresult = (e) => setText((t) => `${t} ${e.results[0][0].transcript}`.trim());
    rec.onend = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  };

  return (
    <section className="glass flex h-full min-h-[540px] flex-col overflow-hidden rounded-2xl" aria-label="Emergency assessment chat">
      <div className="flex items-center gap-3 border-b border-app px-5 py-3.5 bg-surface">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
          <Stethoscope size={18} />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-sm font-bold text-primary">Emergency Triage Assistant</h1>
          <p className="text-xs text-secondary">Input clinical presentation for decision support ranking</p>
        </div>
        {triage && (
          <Pill tone="neutral">{patient.symptoms.length} symptoms · {Object.keys(patient.vitals).length} vitals</Pill>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 bg-app">
        {messages.map((m) => <Bubble key={m.id} m={m} ranked={ranked} triage={triage} onSelect={onSelect} />)}
        {thinking && (
          <div className="flex w-fit items-center gap-2 rounded-xl border border-app bg-surface px-4 py-2 text-xs text-secondary" aria-label="Analysing">
            <span className="font-medium">Evaluating symptoms and vitals...</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-blue-600" animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
        {!started && (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Quick Clinical Scenarios</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCENARIOS.map((s) => (
                <button key={s.title} onClick={() => onSend(s.text)}
                  className="group rounded-xl border border-app bg-surface p-3 text-left transition hover:border-blue-500 hover:bg-surface-elevated cursor-pointer">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400">{s.title}</div>
                  <div className="mt-1 text-xs text-secondary line-clamp-2 leading-relaxed">{s.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-app p-3.5 bg-surface">
        {started && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {FOLLOW_UPS.map((f) => (
              <button key={f} onClick={() => onSend(f)} className="rounded-lg border border-app bg-surface-elevated px-2.5 py-1 text-xs font-medium text-secondary hover:text-primary hover:bg-surface-muted transition cursor-pointer">{f}</button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-app bg-surface-elevated p-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
          <textarea
            value={text} rows={1} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Describe symptoms, SpO2, HR, BP, or age..."
            className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs text-primary outline-none placeholder:text-muted"
            aria-label="Describe the emergency presentation"
          />
          <button onClick={toggleMic} aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            className={cn('grid h-8 w-8 place-items-center rounded-lg transition cursor-pointer', listening ? 'bg-red-600 text-white' : 'text-secondary hover:bg-surface-muted hover:text-primary')}>
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <Button variant="primary" className="h-8 w-8 !p-0 shrink-0" onClick={() => submit()} aria-label="Send"><ArrowUp size={15} /></Button>
        </div>
      </div>
    </section>
  );
}

function Bubble({ m, ranked, triage, onSelect }: { m: ChatMessage; ranked: RankedHospital[]; triage: TriageResult | null; onSelect: (id: string) => void }) {
  const mine = m.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={cn('flex', mine && 'justify-end')}>
      {m.kind === 'text' && (
        <div className={cn('max-w-[88%] rounded-xl px-3.5 py-2 text-xs leading-relaxed border', mine ? 'bg-blue-600 text-white border-blue-600 font-medium' : 'bg-surface text-primary border-app')}>
          {m.text}
        </div>
      )}
      {m.kind === 'triage' && m.triage && <TriageCard t={m.triage} />}
      {m.kind === 'reco' && <RecoCard top={ranked[0]} active={!!triage} onSelect={onSelect} />}
      {m.kind === 'list' && <ListCard ranked={ranked} onSelect={onSelect} />}
    </motion.div>
  );
}

function TriageCard({ t }: { t: TriageResult }) {
  const s = SEVERITY[t.severity];
  return (
    <div className={cn('w-full max-w-[98%] rounded-xl p-4 border space-y-3', s.bg, s.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface border border-app shadow-xs">
            <AlertTriangle size={18} className={s.text} />
          </div>
          <div>
            <div className={cn('font-display text-sm font-bold', s.text)}>{s.label}</div>
            <div className="text-xs font-semibold text-secondary">{s.level} · {t.category}</div>
          </div>
        </div>
        <span className={cn('rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider', s.badge)}>
          {t.severity}
        </span>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-muted mb-1">Clinical Reasoning Indicators</div>
        <div className="flex flex-wrap gap-1.5">
          {t.reasons.map((r) => <Pill key={r} tone="neutral">{r}</Pill>)}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold text-muted mb-1">Required Specialist Facilities</div>
        <div className="flex flex-wrap gap-1.5">
          {t.required.map((k: FacilityKey) => <Pill key={k} tone="signal"><Check size={11} />{FACILITY_LABEL[k]}</Pill>)}
        </div>
      </div>

      <div className="pt-1 border-t border-app/50 text-[11px] text-muted flex items-center gap-1.5">
        <ShieldAlert size={12} className="shrink-0" />
        <span>Clinical decision support only. Predictions do not replace professional medical judgment.</span>
      </div>
    </div>
  );
}

function RecoCard({ top, active, onSelect }: { top?: RankedHospital; active: boolean; onSelect: (id: string) => void }) {
  if (!top || !active) return null;
  const h = top.hospital;
  return (
    <div className="w-full max-w-[98%] rounded-xl border border-blue-200 dark:border-blue-800/70 bg-blue-50/70 dark:bg-blue-950/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 border-b border-blue-200 dark:border-blue-800/50 pb-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            {top.suitable ? 'Recommended Hospital' : 'Closest Partial Match'}
          </span>
          <h3 className="font-display text-base font-bold text-primary mt-0.5">{h.name}</h3>
          <div className="text-xs text-secondary">{h.area}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-primary">{top.etaMin}<span className="text-xs font-medium text-secondary"> min</span></div>
          <div className="text-xs text-secondary">{top.distanceKm.toFixed(1)} km</div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-primary mb-1.5">Matching Criteria Rationale</div>
        <ul className="space-y-1 text-xs">
          {whyThisHospital(top).map((w) => (
            <li key={w} className="flex items-start gap-1.5 text-secondary"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />{w}</li>
          ))}
          {top.missing.map((w) => (
            <li key={w.key} className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400"><X size={14} className="mt-0.5 shrink-0" />{w.detail}. Call ahead to confirm.</li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="primary" className="py-1.5 text-xs" onClick={() => onSelect(h.id)}>Focus on Map</Button>
        <a href={`tel:${h.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-xl border border-app bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-elevated">
          <Phone size={13} /> {h.phone}
        </a>
      </div>
    </div>
  );
}

function ListCard({ ranked, onSelect }: { ranked: RankedHospital[]; onSelect: (id: string) => void }) {
  return (
    <div className="w-full max-w-[98%] rounded-xl border border-app bg-surface p-3 space-y-2">
      <div className="text-xs font-semibold text-primary px-1">Other Qualified Facilities</div>
      {ranked.slice(0, 4).map((r) => (
        <button key={r.hospital.id} onClick={() => onSelect(r.hospital.id)} className="flex w-full items-center justify-between rounded-lg p-2 text-left text-xs hover:bg-surface-elevated transition cursor-pointer">
          <span className="font-medium text-primary">{r.hospital.name}</span>
          <span className="flex items-center gap-2 text-secondary">{r.etaMin} min<Pill tone={r.suitable ? 'ok' : 'bad'}>{r.suitable ? 'Suitable' : 'Missing facility'}</Pill></span>
        </button>
      ))}
    </div>
  );
}
