import type { FacilityKey, PatientCase, Severity, SymptomKey, TriageResult, Vitals } from '../types';

export const SYMPTOMS: { key: SymptomKey; label: string; re: RegExp }[] = [
  { key: 'chest_pain', label: 'Chest pain', re: /chest (pain|tight|pressure)|heart attack|angina/i },
  { key: 'breathing', label: 'Breathing difficulty', re: /breath|dyspn|gasping|choking|wheez/i },
  { key: 'bleeding', label: 'Severe bleeding', re: /bleed|hemorrhag|haemorrhag|blood loss/i },
  { key: 'unconscious', label: 'Unconscious', re: /unconscious|unresponsive|passed out|collapsed|fainted|not waking/i },
  { key: 'abdominal', label: 'Abdominal pain', re: /abdom|stomach pain|belly/i },
  { key: 'head_injury', label: 'Head injury', re: /head (injur|trauma|hit)|hit (his|her|the|my) head/i },
  { key: 'stroke', label: 'Stroke signs', re: /stroke|face droop|slurred|one[- ]sided|paraly/i },
  { key: 'burns', label: 'Burns', re: /burn|scald/i },
  { key: 'trauma', label: 'Accident / trauma', re: /accident|crash|fracture|stab|gunshot|fell from|fall from|trauma/i },
  { key: 'seizure', label: 'Seizure', re: /seizure|convuls|\bfits?\b/i },
  { key: 'fever', label: 'High fever', re: /fever|high temp/i },
];
export const symptomLabel = (k: SymptomKey) => SYMPTOMS.find((s) => s.key === k)?.label ?? k;

const num = (m: RegExpMatchArray | null, i = 1) => (m && m[i] !== undefined ? Number(m[i]) : undefined);

/** Free-text parser: pulls symptoms and vitals out of a chat message. */
export function parseInput(text: string): PatientCase {
  const symptoms = SYMPTOMS.filter((s) => s.re.test(text)).map((s) => s.key);
  const vitals: Vitals = {};
  vitals.spo2 = num(text.match(/(?:spo2|sp02|spo₂|oxygen(?: saturation)?|saturation)\D{0,8}(\d{2,3})/i));
  vitals.hr = num(text.match(/(?:\bhr\b|heart ?rate|pulse)\D{0,8}(\d{2,3})/i)) ?? num(text.match(/(\d{2,3})\s*bpm/i));
  const bp = text.match(/(?:\bbp\b|blood pressure)?\D{0,4}(\d{2,3})\s*\/\s*(\d{2,3})/i);
  if (bp) { vitals.sbp = Number(bp[1]); vitals.dbp = Number(bp[2]); }
  vitals.rr = num(text.match(/(?:\brr\b|resp(?:iratory)? rate|breaths?(?: per min)?)\D{0,6}(\d{1,2})\b/i));
  vitals.temp = num(text.match(/(?:temp(?:erature)?)\D{0,6}(\d{2,3}(?:\.\d)?)/i));
  vitals.gcs = num(text.match(/gcs\D{0,4}(\d{1,2})/i));
  (Object.keys(vitals) as (keyof Vitals)[]).forEach((k) => vitals[k] === undefined && delete vitals[k]);
  const age = num(text.match(/(\d{1,3})\s*(?:y\/?o|yo|years?|yrs?)\b/i)) ?? num(text.match(/\bage\D{0,3}(\d{1,3})/i));
  const severe = /severe|major|massive|heavy|uncontrolled|critical/i.test(text) || undefined;
  return { symptoms, vitals, age, severe };
}

export const emptyCase = (): PatientCase => ({ symptoms: [], vitals: {}, age: undefined, severe: undefined });
export const hasSignal = (c: PatientCase) => c.symptoms.length > 0 || Object.keys(c.vitals).length > 0;
export const mergeCase = (a: PatientCase, b: PatientCase): PatientCase => ({
  symptoms: Array.from(new Set([...a.symptoms, ...b.symptoms])),
  vitals: { ...a.vitals, ...b.vitals },
  age: b.age ?? a.age,
  severe: b.severe ?? a.severe,
});

/**
 * Rule-based triage prototype. Points accumulate from vitals and symptoms.
 * Decision support only: a qualified medical professional makes the final call.
 */
export function assess(c: PatientCase): TriageResult {
  const { vitals: v, symptoms: s } = c;
  let score = 0;
  const reasons: string[] = [];
  const add = (n: number, why: string) => { score += n; reasons.push(why); };

  if (v.spo2 !== undefined) { if (v.spo2 < 90) add(5, `SpO₂ ${v.spo2}% is very low`); else if (v.spo2 < 94) add(3, `SpO₂ ${v.spo2}% is low`); }
  if (v.hr !== undefined) { if (v.hr > 130 || v.hr < 45) add(3, `Heart rate ${v.hr} is critical`); else if (v.hr > 110) add(2, `Heart rate ${v.hr} is high`); }
  if (v.sbp !== undefined) { if (v.sbp < 90) add(4, `Systolic BP ${v.sbp} is low`); else if (v.sbp > 180) add(2, `Systolic BP ${v.sbp} is very high`); }
  if (v.rr !== undefined) { if (v.rr > 30 || v.rr < 8) add(4, `Respiratory rate ${v.rr} is critical`); else if (v.rr > 24) add(2, `Respiratory rate ${v.rr} is raised`); }
  if (v.temp !== undefined) { if (v.temp > 39.5 || v.temp < 35) add(2, `Temperature ${v.temp}°C is abnormal`); }
  if (v.gcs !== undefined) { if (v.gcs <= 8) add(5, `GCS ${v.gcs}: severely reduced consciousness`); else if (v.gcs <= 12) add(3, `GCS ${v.gcs}: reduced consciousness`); }

  const w: Record<SymptomKey, [number, string]> = {
    unconscious: [5, 'Patient is unconscious'], bleeding: [4, 'Severe bleeding'], stroke: [4, 'Stroke-like symptoms'],
    breathing: [3, 'Breathing difficulty'], chest_pain: [3, 'Chest pain'], head_injury: [3, 'Head injury'],
    trauma: [3, 'Accident / trauma'], burns: [3, 'Burns'], seizure: [2, 'Seizure'], abdominal: [2, 'Abdominal pain'], fever: [1, 'High fever'],
  };
  s.forEach((k) => add(w[k][0], w[k][1]));
  if (c.severe && s.length > 0) add(2, 'Described as severe');
  if (c.age !== undefined && (c.age >= 65 || c.age <= 5)) add(1, `Age ${c.age} is higher risk`);

  const severity: Severity = score >= 7 ? 'critical' : score >= 4 ? 'high' : score >= 2 ? 'moderate' : 'low';
  const has = (k: SymptomKey) => s.includes(k);
  const lowO2 = v.spo2 !== undefined && v.spo2 < 92;
  const respiratory = has('breathing') || lowO2;

  const category =
    has('chest_pain') && respiratory ? 'Cardio-respiratory emergency'
    : has('chest_pain') ? 'Cardiac emergency'
    : respiratory ? 'Respiratory emergency'
    : has('trauma') || has('bleeding') ? 'Major trauma'
    : has('stroke') || has('head_injury') || has('seizure') || has('unconscious') ? 'Neurological emergency'
    : has('burns') ? 'Burn injury'
    : has('abdominal') ? 'Abdominal emergency' : 'General emergency';

  const req = new Set<FacilityKey>(['emergency']);
  const serious = severity === 'critical' || severity === 'high';
  if (severity === 'critical') req.add('icu');
  if (has('chest_pain')) { req.add('cardiac'); if (serious) req.add('icu'); }
  if (respiratory && serious) req.add('icu');
  if (respiratory && severity === 'critical') req.add('ventilator');
  if (has('trauma') || has('bleeding')) { req.add('trauma'); if (serious) req.add('oxygen'); }
  if (has('stroke') || has('head_injury')) req.add('neuro');
  if (has('seizure') && serious) req.add('neuro');
  if (has('unconscious')) req.add('icu');
  if (has('burns')) req.add('burn');

  return { severity, category, score, reasons, required: Array.from(req) };
}
