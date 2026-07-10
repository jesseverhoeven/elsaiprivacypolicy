/**
 * Deterministic free-text analyser. NO AI — pure keyword/pattern rules against the
 * Handbook pick-lists, so the same text always yields the same suggestions
 * (brief §2.3). The analyser only PROPOSES; the officer accepts or rejects every
 * suggestion on the gap screen.
 */

import {
  DATA_CATEGORY_DEFS, DATA_SUBJECT_OPTIONS, SOURCE_OPTIONS,
  INTERNAL_RECIPIENT_OPTIONS, EXTERNAL_RECIPIENT_OPTIONS,
  PURPOSE_SUGGESTIONS, ART9_SIGNALS, COMMON_THIRD_COUNTRIES, EEA_COUNTRIES,
} from '../data/picklists';

export interface AnalysisResult {
  emails: string[];
  phones: string[];
  jotformLinks: string[];
  groupNames: string[];
  activityTitleGuess: string;
  audienceGuess: 'volunteers' | 'participants' | null;
  dataSubjectIds: string[];
  dataCategoryIds: string[];
  sourceIds: string[];
  internalRecipientIds: string[];
  externalRecipientIds: string[];
  purposeTexts: string[];
  thirdCountries: string[];
  art9Signals: { label: string; evidence: string }[];
  minorsSignal: boolean;
  /** Evidence snippets keyed by suggestion id, for the "why?" display. */
  evidence: Record<string, string>;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?:\+|00)\d[\d\s().-]{7,18}\d/g;
const JOTFORM_RE = /https?:\/\/(?:[\w-]+\.)?jotform\.com\/[^\s"'<>)]+/gi;
const ELSA_GROUP_RE = /ELSA\s+([A-ZÀ-Þ][A-Za-zÀ-ž'-]+(?:\s+[A-ZÀ-Þ][A-Za-zÀ-ž'-]+){0,3})/g;

/** Words that end an "ELSA <place>" capture — avoids swallowing sentence tails. */
const GROUP_STOPWORDS = new Set(['The', 'A', 'An', 'Is', 'Will', 'And', 'Or', 'For', 'To', 'Team', 'Board', 'Privacy', 'Data']);

/**
 * Event-name words that must never be mistaken for a group name — "ELSA Winter Law
 * School" is an event, not a controller (user feedback 2026-07-10: derive controller
 * and event title from the text as reliably as possible).
 */
const GROUP_EVENT_WORDS = new Set([
  'Law', 'Schools', 'School', 'Winter', 'Summer', 'Conference', 'Conferences', 'Moot', 'Court',
  'Delegation', 'Delegations', 'Study', 'Visit', 'Visits', 'Webinar', 'Gala', 'Training',
  'Competition', 'Competitions', 'Day', 'Week', 'Weekend', 'Event', 'Events', 'NCM', 'ICM',
  'Officers', 'Officer', 'Member', 'Members', 'Alumni', 'Seminar', 'Seminars', 'Negotiation',
]);

/** Event title: optional leading capitalised words + a known event keyword + optional year. */
const EVENT_TITLE_RE =
  /\b((?:[A-ZÀ-Þ][\w&’'-]*\s+){0,3}(?:NCM|ICM|KAM|SAM|National Council Meeting|International Council Meeting|Summer Law School|Winter Law School|Law School|Moot Court(?: Competition)?|EMC2|Delegation|Study Visit|Institutional Visit|Legal Research Group|Conference|Workshop|Webinar|Gala|Training|Summer School|Negotiation Competition)(?:\s+\d{4})?)/;

const VOLUNTEER_WORDS = ['volunteer', 'officer', 'board member', 'recruit', 'team member', 'director of', 'vice president'];
const PARTICIPANT_WORDS = ['participant', 'attendee', 'delegate', 'registration', 'sign up', 'signup', 'ticket', 'guest', 'applicant'];
const MINORS_WORDS = ['minor', 'under 18', 'under the age of 18', 'pupil', 'high school', 'secondary school', 'parental consent', 'guardian'];

function findKeyword(text: string, keywords: string[]): string | null {
  for (const kw of keywords) {
    const idx = text.indexOf(kw);
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + kw.length + 40);
      return '…' + text.slice(start, end).replace(/\s+/g, ' ').trim() + '…';
    }
  }
  return null;
}

export function analyzeText(raw: string): AnalysisResult {
  const text = raw.replace(/\s+/g, ' ');
  const lower = text.toLowerCase();
  const evidence: Record<string, string> = {};

  const emails = [...new Set(text.match(EMAIL_RE) ?? [])];
  const phones = [...new Set((text.match(PHONE_RE) ?? []).map((p) => p.trim()))];
  const jotformLinks = [...new Set(text.match(JOTFORM_RE) ?? [])];

  const groupNames: string[] = [];
  for (const m of text.matchAll(ELSA_GROUP_RE)) {
    const words: string[] = [];
    for (const w of m[1].split(/\s+/)) {
      if (GROUP_STOPWORDS.has(w) || GROUP_EVENT_WORDS.has(w)) break; // stop at event/sentence words
      words.push(w);
      if (w === 'International') break; // "ELSA International" is a valid controller by itself
    }
    if (words.length > 0 && !groupNames.includes(words.join(' '))) groupNames.push(words.join(' '));
  }
  // Prefer "International" if explicitly present (common controller for EI events)
  if (groupNames.includes('International')) {
    groupNames.splice(groupNames.indexOf('International'), 1);
    groupNames.unshift('International');
  }

  const titleMatch = text.match(EVENT_TITLE_RE);
  const activityTitleGuess = titleMatch ? titleMatch[1].trim().replace(/^(?:the|a|an)\s+/i, 'the ') : '';

  const volunteerHit = findKeyword(lower, VOLUNTEER_WORDS);
  const participantHit = findKeyword(lower, PARTICIPANT_WORDS);
  let audienceGuess: AnalysisResult['audienceGuess'] = null;
  if (participantHit && !volunteerHit) audienceGuess = 'participants';
  else if (volunteerHit && !participantHit) audienceGuess = 'volunteers';
  else if (participantHit && volunteerHit) audienceGuess = 'participants'; // events usually address participants
  if (audienceGuess) evidence['audience'] = (audienceGuess === 'participants' ? participantHit : volunteerHit) ?? '';

  const dataSubjectIds: string[] = [];
  for (const ds of DATA_SUBJECT_OPTIONS) {
    const kw = ds.label.toLowerCase().split(' (')[0];
    const hit = findKeyword(lower, [kw]);
    if (hit) { dataSubjectIds.push(ds.id); evidence[`ds:${ds.id}`] = hit; }
  }
  if (findKeyword(lower, ['participant', 'attendee', 'delegate']) && !dataSubjectIds.includes('participants')) {
    dataSubjectIds.push('participants');
    evidence['ds:participants'] = findKeyword(lower, ['participant', 'attendee', 'delegate']) ?? '';
  }
  if (findKeyword(lower, ['speaker']) && !dataSubjectIds.includes('speakers')) {
    dataSubjectIds.push('speakers');
    evidence['ds:speakers'] = findKeyword(lower, ['speaker']) ?? '';
  }
  if (findKeyword(lower, ['emergency contact']) && !dataSubjectIds.includes('emergency-contacts')) {
    dataSubjectIds.push('emergency-contacts');
    evidence['ds:emergency-contacts'] = findKeyword(lower, ['emergency contact']) ?? '';
  }

  const dataCategoryIds: string[] = [];
  for (const cat of DATA_CATEGORY_DEFS) {
    const hit = findKeyword(lower, cat.keywords);
    if (hit) { dataCategoryIds.push(cat.id); evidence[`cat:${cat.id}`] = hit; }
  }

  const sourceIds: string[] = [];
  for (const s of SOURCE_OPTIONS) {
    const hit = findKeyword(lower, s.keywords);
    if (hit) { sourceIds.push(s.id); evidence[`src:${s.id}`] = hit; }
  }
  if (jotformLinks.length > 0 && !sourceIds.includes('jotform')) {
    sourceIds.push('jotform');
    evidence['src:jotform'] = jotformLinks[0];
  }

  const internalRecipientIds: string[] = [];
  for (const r of INTERNAL_RECIPIENT_OPTIONS) {
    const hit = findKeyword(lower, r.keywords);
    if (hit) { internalRecipientIds.push(r.id); evidence[`ri:${r.id}`] = hit; }
  }

  const externalRecipientIds: string[] = [];
  for (const r of EXTERNAL_RECIPIENT_OPTIONS) {
    const hit = findKeyword(lower, r.keywords);
    if (hit) { externalRecipientIds.push(r.id); evidence[`re:${r.id}`] = hit; }
  }

  const purposeTexts: string[] = [];
  for (const p of PURPOSE_SUGGESTIONS) {
    if (p.keywords.length === 0) continue;
    const hit = findKeyword(lower, p.keywords);
    if (hit) { purposeTexts.push(p.text); evidence[`purpose:${p.text}`] = hit; }
  }

  const thirdCountries: string[] = [];
  for (const c of COMMON_THIRD_COUNTRIES) {
    if (EEA_COUNTRIES.includes(c)) continue;
    const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const m = text.match(re);
    if (m) {
      const canonical = c === 'USA' ? 'United States' : c === 'UK' ? 'United Kingdom' : c;
      if (!thirdCountries.includes(canonical)) {
        thirdCountries.push(canonical);
        evidence[`country:${canonical}`] = m[0];
      }
    }
  }

  const art9Signals: { label: string; evidence: string }[] = [];
  for (const sig of ART9_SIGNALS) {
    const hit = findKeyword(lower, sig.keywords);
    if (hit) art9Signals.push({ label: sig.label, evidence: hit });
  }

  const minorsSignal = findKeyword(lower, MINORS_WORDS) !== null;
  if (minorsSignal) evidence['minors'] = findKeyword(lower, MINORS_WORDS) ?? '';

  return {
    emails, phones, jotformLinks, groupNames, activityTitleGuess, audienceGuess,
    dataSubjectIds, dataCategoryIds, sourceIds, internalRecipientIds, externalRecipientIds,
    purposeTexts, thirdCountries, art9Signals, minorsSignal, evidence,
  };
}
