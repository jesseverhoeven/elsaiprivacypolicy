/**
 * PRESET EVENTS — generated from ELSA's approved privacy policies (current +
 * archived) by `scripts/build-presets.py`. Choosing one in step 1 pre-fills all
 * VARIABLE information from the most recent approved policy for that event; the
 * fixed Annex 4 wording always comes from the clause library, never from here.
 *
 * To add a newly approved policy: drop it in the policies folder, run
 *   python scripts/build-presets.py "<folder>"
 * and commit the regenerated presets.generated.json — no database needed.
 */

import type { Answers, LegalBasis } from '../types';
import { EXTERNAL_RECIPIENT_OPTIONS, INTERNAL_RECIPIENT_OPTIONS, INTERNATIONAL_ORG_RE } from './picklists';
import generated from './presets.generated.json';

export type AttentionSection =
  | 'controller' | 'subjects' | 'categories' | 'purposes' | 'recipients' | 'transfers' | 'general';

export interface AttentionPoint {
  section: AttentionSection;
  text: string;
}

export interface PresetEvent {
  id: string;
  name: string;
  area: string;
  lastUpdated: string;
  sourceFile: string;
  audience: 'volunteers' | 'participants';
  controller: { name: string; address: string; email: string; phone: string };
  subjects: string[];
  categories: { id: string; items: string }[];
  customCategories: { label: string; items: string }[];
  purposes: { text: string; basis: LegalBasis }[];
  recipients: string[];
  transfersOutsideEEA: boolean;
  thirdCountries: string[];
  internationalOrgs: string[];
  directSources: string[];
  indirectSources: string[];
  attentionPoints: AttentionPoint[];
}

interface GeneratedPreset {
  file: string; name: string; area: string; lastUpdated: string; audience: string;
  controller: { name: string; address: string; email: string; phone: string };
  subjects: string[];
  categories: { id: string; items: string }[];
  customCategories: { label: string; items: string }[];
  purposes: { text: string; basis: string }[];
  recipients: string[];
  transfersOutsideEEA: boolean;
  thirdCountries: string[];
  internationalOrgs: string[];
  directSources: string[];
  indirectSources: string[];
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Common ELSA abbreviations — shown alongside the short name (user request 2026-07-11). */
export const ABBREVIATIONS: Record<string, string> = {
  WELS: 'Winter ELSA Law Schools',
  SELS: 'Summer ELSA Law Schools',
  ICM: 'International Council Meeting',
  ICMs: 'International Council Meetings',
  NCM: 'National Council Meeting',
  ISM: 'International Strategy Meeting',
  ITM: 'International Training Meeting',
  IIM: 'International Internal Meeting',
  NGR: 'National Group Report',
  EIT: 'ELSA International Team',
  ROLE: 'Rule of Law Education',
  TtF: 'Train the Facilitators',
  TC: 'Training Conference',
  AHRC: 'Annual Human Rights Campaign',
  EDF: 'ELSA Development Foundation',
  WFD: 'World Forum for Democracy',
  OC: 'Organising Committee',
  IB: 'International Board',
  BEE: 'Board Management, External Relations & Expansion',
};

/** "WELS — Participants" → "Winter ELSA Law Schools (WELS)" etc.; null if nothing to expand. */
export function expandAbbreviations(name: string): string | null {
  const hits = Object.keys(ABBREVIATIONS).filter((a) => new RegExp(`\\b${a}\\b`).test(name));
  if (hits.length === 0) return null;
  return hits.map((a) => ABBREVIATIONS[a]).join(' · ');
}

/** Event title for the policy: abbreviation kept, full name added — "WELS" → "Winter ELSA Law Schools (WELS)". */
export function titleWithExpansion(base: string): string {
  const hit = Object.keys(ABBREVIATIONS).find((a) => new RegExp(`\\b${a}\\b`).test(base));
  if (!hit) return base;
  return base.replace(new RegExp(`\\b${hit}\\b`), `${ABBREVIATIONS[hit]} (${hit})`);
}

/**
 * Customised per-section remark shown under each questionnaire heading — brief,
 * event-specific, phrased as questions the officer can ask themselves
 * (user decision 2026-07-11). Item-specific "what could have changed" tips live
 * in hover tooltips per item, not here.
 */
function buildAttention(p: GeneratedPreset): AttentionPoint[] {
  const points: AttentionPoint[] = [];
  const short = p.name.split(' — ')[0];
  points.push({
    section: 'controller',
    text: `The previous ${short} policy named ELSA ${p.controller.name} as sole controller. Ask yourself: is that still who decides why and how the data is used this edition? Does an Organising Committee or another group co-decide (then tick joint controllers below)?`,
  });
  if (p.subjects.length > 0) {
    points.push({
      section: 'subjects',
      text: `The previous policy covered: ${p.subjects.join('; ')}. Ask yourself: does the same audience take part this edition, and is anyone new involved (speakers, coaches, externals, emergency contacts)?`,
    });
  } else {
    points.push({
      section: 'subjects',
      text: 'Ask yourself: whose data does this edition actually touch — participants, speakers, coaches, emergency contacts, externals?',
    });
  }
  points.push({
    section: 'categories',
    text: `Prefilled from the previous ${short} policy — scroll the list and untick anything no longer collected. Ask yourself: does this edition’s registration form ask anything new (photos or recordings, health or dietary questions, payment or travel details)? Hover an orange item (↻) for what typically changes for that category.`,
  });
  const consentCount = p.purposes.filter((x) => x.basis === 'consent').length;
  points.push({
    section: 'purposes',
    text: consentCount > 0
      ? `Prefilled from the previous policy; ${consentCount} purpose${consentCount > 1 ? 's' : ''} rel${consentCount > 1 ? 'y' : 'ies'} on consent — make sure each matching opt-in tick-box is on this edition’s registration form. Ask yourself: does this edition do anything new (new activities, new communications, new sharing)?`
      : 'Prefilled from the previous policy. Ask yourself: does this edition do anything new or differently — new activities, new communications, anything participants opt into?',
  });
  points.push({
    section: 'recipients',
    text: 'Prefilled from the previous policy. Ask yourself: same registration platform, payment provider, accommodation, caterers and partners this edition? Unsure whether to untick one? Ask dataprotection@elsa.org rather than guessing.',
  });
  if (p.transfersOutsideEEA) {
    points.push({
      section: 'transfers',
      text: `The previous policy listed transfers${p.thirdCountries.length ? ` to ${p.thirdCountries.join(', ')}` : ' outside the EEA'}${p.internationalOrgs.length ? ` and to ${p.internationalOrgs.join(', ')}` : ''}. Ask yourself: are these still the providers, countries and organisations involved this edition?`,
    });
  }
  points.push({
    section: 'general',
    text: `Foundation: ${p.file.split('\\').pop()}${p.lastUpdated ? ` (last updated ${p.lastUpdated})` : ''}. Set a new date and version for this edition.`,
  });
  return points;
}

/**
 * Map a recipient phrase from a past policy onto the standard pick-list option
 * where clearly the same thing (e.g. "Cloud Server Providers" → the standard
 * "Cloud Server Providers (e.g. Google Workspace/Gmail, Microsoft)") so the
 * list never shows near-duplicates. Unmatched phrases stay as custom entries.
 */
export function canonicalRecipient(raw: string): { list: 'internal' | 'external'; label: string } {
  const base = raw.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
  for (const opt of INTERNAL_RECIPIENT_OPTIONS) {
    const optBase = opt.label.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
    if (base === optBase || base.includes(optBase) || optBase.includes(base)) return { list: 'internal', label: opt.label };
  }
  for (const opt of EXTERNAL_RECIPIENT_OPTIONS) {
    const optBase = opt.label.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
    if (base === optBase || optBase.startsWith(base) || base.startsWith(optBase)) return { list: 'external', label: opt.label };
    if (opt.keywords.some((k) => base.includes(k))) return { list: 'external', label: opt.label };
  }
  const isInternal = /elsa|national group|local group|organising committee|organizing committee|international board/i.test(raw);
  return { list: isInternal ? 'internal' : 'external', label: raw };
}

export const PRESET_EVENTS: PresetEvent[] = (generated as GeneratedPreset[]).map((p) => ({
  id: slug(p.name),
  name: p.name,
  area: p.area,
  lastUpdated: p.lastUpdated,
  sourceFile: p.file.split('\\').pop() ?? p.file,
  audience: p.audience === 'volunteers' ? 'volunteers' : 'participants',
  controller: p.controller,
  subjects: p.subjects,
  categories: p.categories,
  customCategories: p.customCategories,
  purposes: p.purposes.map((x) => ({ text: x.text, basis: x.basis as LegalBasis })),
  recipients: p.recipients,
  transfersOutsideEEA: p.transfersOutsideEEA,
  thirdCountries: p.thirdCountries,
  internationalOrgs: p.internationalOrgs,
  directSources: p.directSources,
  indirectSources: p.indirectSources,
  attentionPoints: buildAttention(p),
}));

export const PRESET_AREAS: string[] = [...new Set(PRESET_EVENTS.map((p) => p.area))].sort();

export function presetById(id: string | null): PresetEvent | undefined {
  return PRESET_EVENTS.find((p) => p.id === id);
}

/** Build the Answers prefill from a preset (used by applyPreset in state.ts). */
export function presetToPrefill(p: PresetEvent): Partial<Answers> {
  const internal: string[] = [];
  const external: string[] = [];
  for (const r of p.recipients) {
    const c = canonicalRecipient(r);
    const target = c.list === 'internal' ? internal : external;
    if (!target.includes(c.label)) target.push(c.label);
  }
  // Safety: international organisations are never countries (and vice versa)
  const countries = p.thirdCountries.filter((c) => !INTERNATIONAL_ORG_RE.test(c));
  const orgs = [...p.internationalOrgs];
  for (const c of p.thirdCountries) {
    if (INTERNATIONAL_ORG_RE.test(c) && !orgs.includes(c)) orgs.push(c);
  }
  return {
    activityTitle: titleWithExpansion(p.name.split(' — ')[0]),
    audience: p.audience,
    controllerKind: 'controller',
    controller: { ...p.controller },
    controllerCountry: 'BE', // ELSA International policies; officer can change
    directSources: p.directSources,
    indirectSources: p.indirectSources,
    recipientsInternal: internal,
    recipientsExternal: external,
    transfersOutsideEEA: p.transfersOutsideEEA,
    thirdCountries: countries,
    internationalOrgs: orgs,
    sccContactEmail: p.controller.email,
    noticeDays: 14,
  };
}
