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

function buildAttention(p: GeneratedPreset): AttentionPoint[] {
  const points: AttentionPoint[] = [];
  points.push({
    section: 'controller',
    text: `The previous policy named ELSA ${p.controller.name} as controller — still correct? Is there a joint controller / Organising Committee this edition?`,
  });
  points.push({
    section: 'subjects',
    text: 'These data subjects come from the previous policy — does the same audience take part this edition?',
  });
  points.push({
    section: 'categories',
    text: 'These categories come from the previous policy — is anything new collected this edition (e.g. photos, health data, payment details)?',
  });
  if (p.purposes.some((x) => x.basis === 'consent')) {
    points.push({
      section: 'purposes',
      text: 'Some purposes rely on consent (opt-ins) — check the corresponding tick-boxes are still on this edition’s registration form.',
    });
  } else {
    points.push({ section: 'purposes', text: 'Purposes come from the previous policy — does this edition do anything new or differently?' });
  }
  points.push({
    section: 'recipients',
    text: 'Same recipients as last time? Check the form platform, payment provider, accommodation and any partners for this edition. Are you sure before unticking one? Ask dataprotection@elsa.org if in doubt.',
  });
  if (p.transfersOutsideEEA) {
    points.push({
      section: 'transfers',
      text: `The previous policy listed transfers${p.thirdCountries.length ? ` to ${p.thirdCountries.join(', ')}` : ' outside the EEA'} — are these still the current providers/countries?`,
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
    activityTitle: p.name.split(' — ')[0],
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
