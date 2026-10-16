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

// The officer ticks the audience and the purposes in step 2. The analyser used to
// guess both from free text and deliberately no longer does — keyword guesses were
// too often wrong (user feedback 2026-07-11/12: boilerplate ticked "Manage our human
// resources", and the audience now stays neutral until chosen). So this check has to
// supply them the way the questionnaire does, or §3 comes out empty.
answers.audience = 'participants';
const tick = (...texts: string[]) => {
  answers.purposes = answers.purposes.map((p) => (texts.includes(p.text) ? { ...p, enabled: true } : p));
  for (const t of texts)
    if (!answers.purposes.some((p) => p.text === t))
      throw new Error(`determinism-check: no purpose named "${t}" in the pick-list — update this list.`);
};
tick(
  'Register and manage your participation in the event',                  // contract
  'To provide meals adapted to dietary restrictions and allergies',       // consent
  'To maintain and improve our events',                                   // legitimate interest
  'Comply with applicable legal, tax, accounting or regulatory obligations', // legal obligation
);

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
// Everything below is read defensively: an undefined row used to throw here and
// take the remaining ~20 checks down with it, hiding them instead of failing one.
const table = blocks.find((b) => b.kind === 'basisTable');
ok('§3 renders a basis table', Boolean(table));
ok('§3 has one row per legal basis in use', table?.rows?.length === 4,
  `rows: ${table?.rows?.length ?? 0} (a purpose must be ticked for a basis to appear)`);
const contractRow = table?.rows?.find((r) => r.label.startsWith('Contractual'));
ok('basis lead-in wording preserved inside the table',
  contractRow !== undefined &&
  `${contractRow.label}: ${contractRow.lead}` ===
  fill(S3_LEGAL_BASIS.contractParticipants, { activityTitle: answers.activityTitle, groupName: answers.controller.name, address: answers.controller.address }),
  contractRow ? `${contractRow.label}: ${contractRow.lead}`.slice(0, 80) : 'no Contractual Obligations row');
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

// Rights intro: fixed dataprotection@ + secgen@, never the controller e-mail (user request 2026-10-16)
ok('§7 rights intro names dataprotection@ and secgen@ exactly once each', (() => {
  const intro = blocks.find((b) => b.id === 's7-intro')?.text ?? '';
  return intro.includes('send an email to dataprotection@elsa.org or to secgen@elsa.org.') &&
    intro.split('secgen@elsa.org').length === 2;
})());

// Multi-party joint controllership (SELS, WELS, moot-court Regional Rounds)
ok('no co-host table for an ordinary policy', !blocks.some((b) => b.kind === 'contactTable'));
const sels = PRESET_EVENTS.find((p) => p.name.startsWith('SELS'));
ok('presets: SELS carries its co-host table from the approved policy',
  (sels?.jointControllers.length ?? 0) >= 30 && sels?.coControllerName === 'the Summer ELSA Law School Organisers',
  `${sels?.jointControllers.length} hosts, "${sels?.coControllerName}"`);
ok('presets: every co-host entry has a contact with an e-mail address',
  PRESET_EVENTS.flatMap((p) => p.jointControllers).every((e) => /@/.test(e.contact) && e.group.trim()));
ok('presets: only the multi-host events carry co-hosts',
  PRESET_EVENTS.filter((p) => p.jointControllers.length > 0).every((p) => /SELS|WELS|Moot Court/.test(p.name)));
{
  const sa = applyPreset(sels!.id).answers;
  const sb = assemblePolicy(sa);
  const tables = sb.filter((b) => b.kind === 'contactTable');
  ok('SELS: co-host table appears in the Summary and in §1', tables.map((t) => t.id).join() === 'sum-joint,s1-joint');
  ok('SELS: each table follows its joint-controllership sentence',
    tables.every((t) => sb[sb.indexOf(t) - 1]?.id === `${t.id}-i`));
  ok('SELS: Summary sentence uses the approved wording and collective name',
    sb.find((b) => b.id === 'sum-joint-i')?.text ===
    fill(SUMMARY.jointMultiIntro, { activityTitle: sa.activityTitle, coController: 'the Summer ELSA Law School Organisers' }));
  ok('SELS: §1 states rights can be exercised against each joint controller',
    (sb.find((b) => b.id === 's1-joint-i')?.text ?? '').includes('against each of the joint-controllers'));
  ok('SELS: table lists every host from the approved policy', tables[0].contacts?.length === sels!.jointControllers.length);
  ok('SELS: assembly is deterministic', JSON.stringify(sb) === JSON.stringify(assemblePolicy(applyPreset(sels!.id).answers)));
  const emptied = assemblePolicy({ ...sa, jointControllerEntries: [{ activity: ' ', group: ' ', contact: '' }] });
  ok('blank host rows are ignored (no empty table)', !emptied.some((b) => b.kind === 'contactTable' || b.id === 'sum-joint-i'));
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
