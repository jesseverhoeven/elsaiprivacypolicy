import type { Answers } from './types';
import {
  DATA_CATEGORY_DEFS, PURPOSE_SUGGESTIONS, SOURCE_OPTIONS,
  INTERNAL_RECIPIENT_OPTIONS, EXTERNAL_RECIPIENT_OPTIONS, DATA_SUBJECT_OPTIONS,
} from './data/picklists';
import { presetById, presetToPrefill } from './data/presets';
import type { AnalysisResult } from './logic/analyze';

export function defaultAnswers(): Answers {
  const today = new Date().toISOString().slice(0, 10);
  return {
    activityTitle: '',
    audience: 'participants',
    controllerKind: 'controller',
    controller: { name: '', address: '', email: '', phone: '' },
    extraEmails: [],
    jointController: { name: '', address: '', email: '', phone: '' },
    usesProcessors: false,
    processors: [],
    soleControllerPurposeIds: [],
    controllerCountry: '',
    dpoContact: '',
    dataSubjects: [],
    dataSubjectsOther: '',
    dataCategories: DATA_CATEGORY_DEFS.map((d) => ({ id: d.id, items: d.defaultItems, enabled: false })),
    directSources: [],
    indirectSources: [],
    purposes: PURPOSE_SUGGESTIONS.map((p, i) => ({ id: `p${i}`, text: p.text, basis: p.basis, enabled: false })),
    recipientsInternal: [],
    // Standard ELSA infrastructure (Google Workspace/Gmail, IT providers) is pre-ticked —
    // practically always involved; officers can untick (user request 2026-07-10).
    recipientsExternal: EXTERNAL_RECIPIENT_OPTIONS.filter((r) => r.defaultOn).map((r) => r.label),
    // Google/US infrastructure means data typically leaves the EEA — standardised default,
    // reviewable in step "Complete & check".
    transfersOutsideEEA: true,
    thirdCountries: ['The United States of America'],
    internationalOrgs: [],
    sccContactEmail: '',
    noticeDays: 14,
    retentionPeriods: [],
    minorsInvolved: false,
    includeNoAutomatedDecisions: true,
    explicitConsentConfirmed: false,
    policyDate: today,
    version: '1.0',
    jotformLink: '',
    presetId: null,
    changeNotes: '',
  };
}

/**
 * Purpose texts match ignoring case, whitespace runs, a leading "To " and trailing
 * punctuation — otherwise a preset's "To comply with applicable legal, tax…" would
 * sit next to the built-in "Comply with applicable legal, tax…" and the policy
 * would list the purpose twice (user feedback 2026-07-11).
 */
function samePurpose(a: string, b: string): boolean {
  const norm = (t: string) =>
    t.toLowerCase().replace(/\s+/g, ' ').trim().replace(/^to\s+/, '').replace(/[.\s]+$/, '');
  return norm(a) === norm(b);
}

/**
 * Apply a preset event (approved past policy) over the defaults.
 * Returns the prefilled answers plus the set of "marks" — values that came from
 * the preset, shown in orange in the questionnaire so officers can spot them.
 */
export function applyPreset(id: string): { answers: Answers; marks: Set<string> } {
  const preset = presetById(id);
  const answers = defaultAnswers();
  const marks = new Set<string>();
  if (!preset) return { answers, marks };

  const prefill = presetToPrefill(preset);
  Object.assign(answers, structuredClone(prefill));
  answers.presetId = preset.id;

  for (const key of Object.keys(prefill)) marks.add(`field:${key}`);
  for (const r of prefill.recipientsInternal ?? []) marks.add(`ri:${r}`);
  for (const r of prefill.recipientsExternal ?? []) marks.add(`re:${r}`);

  // Data subjects: match the Handbook pick-list where possible, otherwise "Other"
  const others: string[] = [];
  for (const s of preset.subjects) {
    const known = DATA_SUBJECT_OPTIONS.find(
      (d) => d.label.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(d.label.toLowerCase().split(' (')[0]),
    );
    if (known) { if (!answers.dataSubjects.includes(known.label)) answers.dataSubjects.push(known.label); marks.add(`ds:${known.label}`); }
    else others.push(s);
  }
  if (others.length > 0) { answers.dataSubjectsOther = others.join('; '); marks.add('field:dataSubjectsOther'); }
  // Fallback: if the previous policy didn't spell out data subjects, derive from the audience
  if (answers.dataSubjects.length === 0 && others.length === 0) {
    const fallback = preset.audience === 'participants' ? 'Participants of the event' : 'National Group Team Officers';
    answers.dataSubjects.push(fallback);
    marks.add(`ds:${fallback}`);
  }

  for (const cat of preset.categories) {
    const entry = answers.dataCategories.find((c) => c.id === cat.id);
    if (entry) { entry.enabled = true; if (cat.items) entry.items = cat.items; marks.add(`cat:${cat.id}`); }
  }
  for (const custom of preset.customCategories) {
    const cid = `custom:${custom.label}`;
    answers.dataCategories.push({ id: cid, customLabel: custom.label, items: custom.items, enabled: true });
    marks.add(`cat:${cid}`);
  }
  for (const p of preset.purposes) {
    const existing = answers.purposes.find((x) => samePurpose(x.text, p.text));
    if (existing) { existing.enabled = true; existing.basis = p.basis; marks.add(`purpose:${existing.id}`); }
    else {
      const idp = `c-preset-${answers.purposes.length}`;
      answers.purposes.push({ id: idp, text: p.text, basis: p.basis, enabled: true });
      marks.add(`purpose:${idp}`);
    }
  }
  return { answers, marks };
}

/** Merge deterministic analysis into answers — analysis only pre-fills; the officer reviews everything. */
export function mergeAnalysis(a: Answers, r: AnalysisResult): Answers {
  const next: Answers = structuredClone(a);

  if (r.groupNames.length > 0 && !next.controller.name) next.controller.name = r.groupNames[0];
  if (r.emails.length > 0 && !next.controller.email) next.controller.email = r.emails[0];
  if (r.phones.length > 0 && !next.controller.phone) next.controller.phone = r.phones[0];
  // The event name and the data categories are deliberately NOT pre-filled from free
  // text — keyword guesses were too often wrong there (user feedback 2026-07-11).
  // They surface as ⚠ suggestion notes in the matching step-2 sections instead.
  if (r.audienceGuess) next.audience = r.audienceGuess;
  if (r.jotformLinks.length > 0 && !next.jotformLink) next.jotformLink = r.jotformLinks[0];

  for (const id of r.dataSubjectIds) {
    const label = DATA_SUBJECT_OPTIONS.find((d) => d.id === id)?.label;
    if (label && !next.dataSubjects.includes(label)) next.dataSubjects.push(label);
  }
  for (const id of r.sourceIds) {
    const label = SOURCE_OPTIONS.find((s) => s.id === id)?.label;
    if (label && !next.directSources.includes(label)) next.directSources.push(label);
    // A form source implies the form platform is a recipient
    if (id === 'jotform' || id === 'google-form' || id === 'website-form') {
      const platform = EXTERNAL_RECIPIENT_OPTIONS.find((o) => o.id === 'form-platforms')!.label;
      if (!next.recipientsExternal.includes(platform)) next.recipientsExternal.push(platform);
    }
  }
  for (const id of r.internalRecipientIds) {
    const label = INTERNAL_RECIPIENT_OPTIONS.find((s) => s.id === id)?.label;
    if (label && !next.recipientsInternal.includes(label)) next.recipientsInternal.push(label);
  }
  for (const id of r.externalRecipientIds) {
    const label = EXTERNAL_RECIPIENT_OPTIONS.find((s) => s.id === id)?.label;
    if (label && !next.recipientsExternal.includes(label)) next.recipientsExternal.push(label);
  }
  // Purposes are NOT auto-ticked from free text — keyword guesses were too easily
  // wrong (user bug report 2026-07-12: template boilerplate ticked "Manage our
  // human resources"). They appear as a ⚠ suggestion note in the purposes section.
  if (r.thirdCountries.length > 0) {
    next.transfersOutsideEEA = true;
    for (const c of r.thirdCountries) {
      const canonical = c === 'United States' ? 'The United States of America' : c;
      if (!next.thirdCountries.includes(canonical)) next.thirdCountries.push(canonical);
    }
  }
  if (r.minorsSignal) next.minorsInvolved = true;
  if (!next.sccContactEmail && next.controller.email) next.sccContactEmail = next.controller.email;

  return next;
}

/* ------------------------------------------------------------------ */
/* Session persistence — sessionStorage only (this browser tab, this   */
/* session); nothing ever leaves the device. Lets officers move back   */
/* and forth between steps without losing input (user request).        */
/* ------------------------------------------------------------------ */

const SESSION_KEY = 'elsaiprivacypolicy-session';

export interface IntakeState {
  files: { name: string; chars: number; text: string; error?: string }[];
  jotformLink: string;
  pasted: string;
  manual: string;
}

export function emptyIntake(): IntakeState {
  return { files: [], jotformLink: '', pasted: '', manual: '' };
}

export interface SessionState {
  step: number;
  answers: Answers;
  edits: Record<string, unknown>;
  intake: IntakeState;
  presetMarks: string[];
}

export function saveSession(s: SessionState): void {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* storage full/blocked — session persistence is best-effort */ }
}

export function loadSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SessionState;
    if (!s.answers) return null;
    return { ...s, answers: { ...defaultAnswers(), ...s.answers }, intake: { ...emptyIntake(), ...s.intake } };
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
