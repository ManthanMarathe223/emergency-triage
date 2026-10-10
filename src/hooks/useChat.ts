import { useCallback, useMemo, useRef, useState } from 'react';
import type { ChatMessage, PatientCase } from '../types';
import { assess, emptyCase, hasSignal, mergeCase, parseInput } from '../lib/triage';
import { uid } from '../lib/util';

const welcome: ChatMessage = {
  id: 'welcome', role: 'bot', kind: 'text',
  text: 'Describe the emergency in your own words. Add vitals if you have them (SpO₂, heart rate, BP, respiratory rate). I will work out severity, the facilities needed, and the best hospital.',
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [thinking, setThinking] = useState(false);
  const [patient, setPatient] = useState<PatientCase>(emptyCase());
  const patientRef = useRef(patient);

  const triage = useMemo(() => (hasSignal(patient) ? assess(patient) : null), [patient]);

  const push = useCallback((m: Omit<ChatMessage, 'id'>) => setMessages((p) => [...p, { ...m, id: uid() }]), []);
  const pushBot = useCallback((text: string) => push({ role: 'bot', kind: 'text', text }), [push]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      push({ role: 'user', kind: 'text', text });
      setThinking(true);
      const lower = text.toLowerCase();

      window.setTimeout(() => {
        if (/^(new patient|reset|clear|start over)/.test(lower)) {
          patientRef.current = emptyCase();
          setPatient(emptyCase());
          pushBot('Cleared. Describe the new patient or emergency.');
        } else if (/\bwhy\b/.test(lower) && hasSignal(patientRef.current)) {
          push({ role: 'bot', kind: 'reco' });
        } else if (/(other|alternative|nearby|list|show).*(hospital|option)|hospitals/.test(lower)) {
          push({ role: 'bot', kind: 'list' });
        } else {
          const parsed = parseInput(text);
          if (!hasSignal(parsed)) {
            pushBot('I could not pick out symptoms or vitals. Try something like "chest pain, difficulty breathing, SpO2 88, HR 120".');
          } else {
            const next = mergeCase(patientRef.current, parsed);
            patientRef.current = next;
            setPatient(next);
            push({ role: 'bot', kind: 'triage', triage: assess(next) });
            push({ role: 'bot', kind: 'reco' });
          }
        }
        setThinking(false);
      }, 750);
    },
    [push, pushBot],
  );

  return { messages, thinking, patient, triage, send, pushBot };
}
