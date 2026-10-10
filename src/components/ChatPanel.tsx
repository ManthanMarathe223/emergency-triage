import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUp, Check, Mic, MicOff, Phone, Sparkles, Siren, X } from 'lucide-react';
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
  { title: 'Child with seizure', text: 'Seizure and high fever, temp 39.8, 4 years' },
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
    <section className="glass flex h-full min-h-[560px] flex-col overflow-hidden rounded-3xl" aria-label="Emergency assessment chat">
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand/15 text-brand-soft"><Siren size={18} /></div>
        <div className="flex-1">
          <h1 className="font-display text-base font-semibold">Emergency assessment</h1>
          <p className="text-xs text-slate-400">Symptoms and vitals in. Severity and hospital out.</p>
        </div>
        {triage && (
          <Pill tone="neutral">{patient.symptoms.length} symptoms · {Object.keys(patient.vitals).length} vitals</Pill>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => <Bubble key={m.id} m={m} ranked={ranked} triage={triage} onSelect={onSelect} />)}
        {thinking && (
          <div className="flex w-fit gap-1.5 rounded-2xl bg-white/6 px-4 py-3" aria-label="Analysing">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="h-2 w-2 rounded-full bg-slate-300" animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
            ))}
          </div>
        )}
        {!started && (
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            {SCENARIOS.map((s) => (
              <button key={s.title} onClick={() => onSend(s.text)}
                className="group rounded-2xl bg-white/4 p-3 text-left ring-1 ring-inset ring-white/8 transition hover:bg-white/8 hover:ring-brand/40">
                <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={14} className="text-brand-soft" />{s.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-400">{s.text}</div>
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/8 p-4">
        {started && (
          <div className="mb-3 flex flex-wrap gap-2">
            {FOLLOW_UPS.map((f) => (
              <button key={f} onClick={() => onSend(f)} className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-inset ring-white/10 transition hover:bg-white/12">{f}</button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl bg-black/30 p-2 ring-1 ring-inset ring-white/10 focus-within:ring-brand/60">
          <textarea
            value={text} rows={1} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="e.g. chest pain, difficulty breathing, SpO2 88, HR 120"
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-500"
            aria-label="Describe the emergency"
          />
          <button onClick={toggleMic} aria-label={listening ? 'Stop voice input' : 'Start voice input'}
            className={cn('grid h-10 w-10 place-items-center rounded-xl transition', listening ? 'bg-brand text-white' : 'text-slate-400 hover:bg-white/8 hover:text-white')}>
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <Button variant="primary" className="h-10 w-10 !p-0" onClick={() => submit()} aria-label="Send"><ArrowUp size={18} /></Button>
        </div>
      </div>
    </section>
  );
}

function Bubble({ m, ranked, triage, onSelect }: { m: ChatMessage; ranked: RankedHospital[]; triage: TriageResult | null; onSelect: (id: string) => void }) {
  const mine = m.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cn('flex', mine && 'justify-end')}>
      {m.kind === 'text' && (
        <div className={cn('max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed', mine ? 'rounded-br-md bg-gradient-to-br from-brand to-[#c2203d] text-white' : 'rounded-bl-md bg-white/6 text-slate-200')}>
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
    <div className={cn('w-full max-w-[96%] rounded-2xl p-4 ring-1 ring-inset', s.bg, s.ring)}>
      <div className="flex items-center gap-3">
        <div className={cn('grid h-10 w-10 place-items-center rounded-xl bg-black/30', s.text)}><AlertTriangle size={20} /></div>
        <div>
          <div className={cn('font-display text-lg font-semibold', s.text)}>{s.label}</div>
          <div className="text-sm text-slate-200">{t.category}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {t.reasons.map((r) => <Pill key={r}>{r}</Pill>)}
      </div>
      <div className="mt-3 text-xs text-slate-400">Facilities needed</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {t.required.map((k: FacilityKey) => <Pill key={k} tone="signal"><Check size={12} />{FACILITY_LABEL[k]}</Pill>)}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Decision support only. This is not a diagnosis.</p>
    </div>
  );
}

function RecoCard({ top, active, onSelect }: { top?: RankedHospital; active: boolean; onSelect: (id: string) => void }) {
  if (!top || !active) return null;
  const h = top.hospital;
  return (
    <div className="w-full max-w-[96%] overflow-hidden rounded-2xl bg-gradient-to-br from-signal/16 to-white/4 ring-1 ring-inset ring-signal/35">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-signal">{top.suitable ? 'Recommended hospital' : 'Closest partial match'}</div>
            <div className="font-display text-lg font-semibold">{h.name}</div>
            <div className="text-xs text-slate-400">{h.area}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-semibold leading-none">{top.etaMin}<span className="ml-1 text-sm font-medium text-slate-400">min</span></div>
            <div className="mt-1 text-xs text-slate-400">{top.distanceKm.toFixed(1)} km</div>
          </div>
        </div>

        <div className="mt-4 text-sm font-semibold">Why this hospital?</div>
        <ul className="mt-2 space-y-1.5">
          {whyThisHospital(top).map((w) => (
            <li key={w} className="flex items-start gap-2 text-sm text-slate-200"><Check size={15} className="mt-0.5 shrink-0 text-ok" />{w}</li>
          ))}
          {top.missing.map((w) => (
            <li key={w.key} className="flex items-start gap-2 text-sm text-warn"><X size={15} className="mt-0.5 shrink-0" />{w.detail}. Call ahead to confirm.</li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={() => onSelect(h.id)}>View on map</Button>
          <a href={`tel:${h.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 rounded-xl bg-white/6 px-3.5 py-2 text-sm font-semibold text-slate-200 ring-1 ring-inset ring-white/10 hover:bg-white/10"><Phone size={15} />Call</a>
        </div>
      </div>
    </div>
  );
}

function ListCard({ ranked, onSelect }: { ranked: RankedHospital[]; onSelect: (id: string) => void }) {
  return (
    <div className="w-full max-w-[96%] rounded-2xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
      <div className="px-1 pb-2 text-sm font-semibold">Other suitable hospitals</div>
      {ranked.slice(0, 4).map((r) => (
        <button key={r.hospital.id} onClick={() => onSelect(r.hospital.id)} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-white/8">
          <span>{r.hospital.name}</span>
          <span className="flex items-center gap-2 text-xs text-slate-400">{r.etaMin} min<Pill tone={r.suitable ? 'ok' : 'bad'}>{r.suitable ? 'Suitable' : 'Missing facility'}</Pill></span>
        </button>
      ))}
    </div>
  );
}
