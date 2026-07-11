/**
 * Determinism + fidelity check (brief §11):
 *  1. Same inputs → byte-for-byte identical assembled policy.
 *  2. Analyser is deterministic on the same text.
 *  3. Fixed sections match the verbatim Annex 4 wording.
 * Run: npm run check
 */

import { assemblePolicy } from '../src/logic/assemble';
import { analyzeText } from '../src/logic/analyze';
import { defaultAnswers, mergeAnalysis, applyPreset } from '../src/state';
import { PRESET_EVENTS, titleWithExpansion } from '../src/data/presets';
import { blockingGaps } from '../src/logic/gaps';
import { S3_LEGAL_BASIS, S4_RETENTION, S6_SECURITY, SUMMARY, fill } from '../src/data/clauses';

const SAMPLE = `ELSA Leuven organises the Summer Law School 2026 in July for 40 international participants.
We register them via JotForm https://form.jotform.com/261234567890 (name, e-mail address, phone,
meal preferences incl. allergies and dietary restrictions, accommodation nights, emergency contact).
We share the rooming list with the hostel and the meal list with the caterer, use Google Drive and Zoom,
and post photos on Instagram. Payment of the participation fee via IBAN. Contact: summerlawschool@nl.elsa.org
Some speakers travel from the United Kingdom.`;

let failures = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail && !cond ? ' — ' + detail : ''}`);
  if (!cond) failures++;
};

// 1. Analyser determinism
const r1 = analyzeText(SAMPLE);
const r2 = analyzeText(SAMPLE);
ok('analyser: same text → same result', JSON.stringify(r1) === JSON.stringify(r2));
ok('analyser: finds e-mail', r1.emails.includes('summerlawschool@nl.elsa.org'));
ok('analyser: finds JotForm link', r1.jotformLinks.length === 1);
ok('analyser: finds ELSA group', r1.groupNames.includes('Leuven'));
ok('analyser: flags Art. 9 (allergies)', r1.art9Signals.length > 0);
ok('analyser: detects health-data category', r1.dataCategoryIds.includes('health-data'));
ok('analyser: detects third country (UK)', r1.thirdCountries.includes('United Kingdom'));
ok('analyser: guesses participants audience', r1.audienceGuess === 'participants');

// 2. Assembly determinism
const base = { ...defaultAnswers(), policyDate: '2026-07-10' };
const answers = mergeAnalysis(base, r1);
answers.controller.name = 'Leuven';
answers.controller.address = 'Tiensestraat 41, 3000 Leuven, Belgium';
answers.activityTitle = 'the Summer Law School 2026';
answers.controllerCountry = 'BE';
answers.transfersOutsideEEA = true;
answers.explicitConsentConfirmed = true;

const p1 = JSON.stringify(assemblePolicy(answers));
const p2 = JSON.stringify(assemblePolicy(structuredClone(answers)));
ok('assembly: same inputs → byte-identical policy', p1 === p2);

// 3. Verbatim fidelity spot-checks against the Annex 4 extraction
ok('fixed §4 Data Retention verbatim',
  S4_RETENTION.body ===
  'We keep personal data for the duration necessary to fulfil the purposes for which it was obtained, per legal and regulatory obligations, as well as contractual agreements. Once this retention period concludes, we either delete or irreversibly anonymize your personal data.');
ok('fixed §6 has three paragraphs', S6_SECURITY.paragraphs.length === 3);
ok('summary rights keep template spelling ("innacuracies")',
  SUMMARY.rightsBullets[1].includes('innacuracies'));
ok('summary rights: eight rights', SUMMARY.rightsBullets.length === 8);

const blocks = assemblePolicy(answers);
const headings = blocks.filter((b) => b.kind === 'heading2').map((b) => b.text);
ok('section order matches Annex 4 (1–9)',
  JSON.stringify(headings.slice(-9)) === JSON.stringify([
    '1 - About us', '2 - Personal Data Collection', '3 - Legal Basis and Purposes', '4 - Data Retention',
    '5 - Data Transfers & Sharing', '6 - Data Security', '7 - Your Rights', '8 - Changes to this Privacy Policy', '9 - Contact Us',
  ]), JSON.stringify(headings));
ok('conditional §5b present when transfers outside EEA', blocks.some((b) => b.text === 'Third-Country and International Organisation Transfers'));

answers.transfersOutsideEEA = false;
ok('conditional §5b absent when no transfers',
  !assemblePolicy(answers).some((b) => b.text === 'Third-Country and International Organisation Transfers'));

const lockedIds = blocks.filter((b) => b.locked).length;
ok('fixed blocks are locked (>25 locked blocks)', lockedIds > 25, String(lockedIds));
ok('every block carries a source reference', blocks.every((b) => b.source.length > 0));
ok('no generator notice inside the policy document (user decision 2026-07-10)',
  !blocks.some((b) => b.kind === 'notice'));
ok('policy starts with "Privacy Policy – <event>" title',
  blocks[0].kind === 'title' && blocks[0].text === 'Privacy Policy – the Summer Law School 2026');
ok('table of contents present (LeCercle layout)', blocks.some((b) => b.kind === 'toc'));
ok('event title not repeated as a detailed-section heading',
  !blocks.some((b) => b.kind !== 'title' && (b.text ?? '').startsWith('Privacy Policy for')));

// The basis/purposes table must not alter the verbatim lead-in wording.
const table = blocks.find((b) => b.kind === 'basisTable')!;
const contractRow = table.rows!.find((r) => r.label.startsWith('Contractual'))!;
ok('basis lead-in wording preserved inside the table',
  `${contractRow.label}: ${contractRow.lead}` ===
  fill(S3_LEGAL_BASIS.contractParticipants, { activityTitle: answers.activityTitle, groupName: answers.controller.name, address: answers.controller.address }));
ok('no generator branding inside the policy blocks',
  !blocks.some((b) => JSON.stringify(b.text ?? '').toLowerCase().includes('elsaiprivacypolicy')));
ok('notice period defaults to 14 days', defaultAnswers().noticeDays === 14);

// Preset system: generated from the approved-policy archive
ok('presets: 40+ events generated from the policy archive', PRESET_EVENTS.length >= 40, String(PRESET_EVENTS.length));
ok('presets: every preset has an area, controller and attention points',
  PRESET_EVENTS.every((p) => p.area && p.controller.name && p.attentionPoints.length >= 3));
const lecercle = PRESET_EVENTS.find((p) => p.name.toLowerCase().includes('lecercle'));
ok('presets: LeCercle uses the newest (amended 03.05.2026) version', lecercle?.lastUpdated === '2026-05-03');
const { answers: pa, marks } = applyPreset(lecercle!.id);
ok('applyPreset: prefills categories/purposes and marks them orange',
  pa.dataCategories.some((c) => c.enabled) && pa.purposes.some((p) => p.enabled) && marks.size > 10);
const pa2 = applyPreset(lecercle!.id).answers;
ok('applyPreset: deterministic', JSON.stringify(pa) === JSON.stringify(pa2));
ok('applyPreset: assembles into a complete policy without error',
  assemblePolicy({ ...pa, activityTitle: pa.activityTitle || 'LeCercle Supporters' }).length > 30);

// Round-3 fixes
ok('presets: recipients deduped onto standard options (no bare "Cloud Server Providers")',
  !pa.recipientsExternal.some((r) => r.toLowerCase() === 'cloud server providers'));
ok('IO/country separation: EYF never rendered as a country', (() => {
  const a2 = { ...defaultAnswers(), activityTitle: 'x', transfersOutsideEEA: true,
    thirdCountries: ['The European Youth Foundation', 'The United States of America'], internationalOrgs: [] };
  const bl = assemblePolicy(a2);
  const countries = bl.find((b) => b.id === 's5b-5')?.bullets ?? [];
  const orgs = bl.find((b) => b.id === 's5b-7')?.bullets ?? [];
  return !countries.some((c) => c.includes('Foundation')) && orgs.some((o) => o.includes('Foundation'));
})());
ok('presets: subjects fallback fills data subjects for participants presets', pa.dataSubjects.length > 0);
// Round-4: Art. 9 auto-purpose data + abbreviation expansion
ok('Medical & dietary purpose group exists with consent purposes', (() => {
  const meds = defaultAnswers().purposes.filter((p) =>
    p.text === 'To provide meals adapted to dietary restrictions and allergies' ||
    p.text.startsWith('To process health data'));
  return meds.length === 2 && meds.every((p) => p.basis === 'consent');
})());
ok('explicit-consent confirmation no longer blocks generation', (() => {
  const a3 = { ...defaultAnswers(), activityTitle: 'x', controller: { name: 'X', address: 'Y', email: 'z@e.org', phone: '1' },
    dataSubjects: ['Alumni'], directSources: ['E-mail'], transfersOutsideEEA: false as const };
  a3.dataCategories = a3.dataCategories.map((c) => c.id === 'health-data' ? { ...c, enabled: true } : c);
  a3.purposes = a3.purposes.map((p) => p.text.includes('meals adapted') ? { ...p, enabled: true } : p);
  return blockingGaps(a3).length === 0;
})());
ok('presets: no two entries share display name + date', (() => {
  const seen = new Set<string>();
  for (const p of PRESET_EVENTS) {
    const k = `${p.name.toLowerCase()}|${p.lastUpdated}`;
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
})());

ok('abbreviations expand in event titles (WELS)', titleWithExpansion('WELS') === 'Winter ELSA Law Schools (WELS)');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
