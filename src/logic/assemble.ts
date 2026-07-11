/**
 * Deterministic assembly engine: Answers → PolicyBlock[] in the EXACT Annex 4
 * order, following the Handbook Ch. 4.2 mapping. Same inputs always produce the
 * same output. Fixed blocks are locked; only variable content (bullets sourced
 * from the officer's answers) can be edited/removed/reordered in the compose step.
 */

import type { Answers, PolicyBlock, LegalBasis } from '../types';
import {
  SRC, SUMMARY, S1_ABOUT_US, S2_COLLECTION, S3_LEGAL_BASIS, S4_RETENTION,
  S5_TRANSFERS, S6_SECURITY, S7_RIGHTS, S8_CHANGES, S9_CONTACT,
  fill,
} from '../data/clauses';
import { DATA_CATEGORY_DEFS, LEGAL_BASIS_DEFS, INTERNATIONAL_ORG_RE } from '../data/picklists';

function contactBullets(a: Answers): string[] {
  const emails = [a.controller.email, ...a.extraEmails.filter((e) => e.trim())].filter(Boolean);
  const lines = [
    `Address: ${a.controller.address}`,
    `E-mail: ${emails.join(', ')}`,
  ];
  if (a.controller.phone.trim()) lines.push(`Phone: ${a.controller.phone}`);
  if (a.controllerKind === 'joint' && a.jointController.name.trim()) {
    lines.push(`${a.jointController.name} — Address: ${a.jointController.address}` +
      (a.jointController.email ? `, E-mail: ${a.jointController.email}` : '') +
      (a.jointController.phone ? `, Phone: ${a.jointController.phone}` : ''));
  }
  return lines;
}

function enabledCategoryBullets(a: Answers): string[] {
  return a.dataCategories
    .filter((c) => c.enabled)
    .map((c) => {
      const def = DATA_CATEGORY_DEFS.find((d) => d.id === c.id);
      const label = c.customLabel ?? def?.label ?? c.id;
      return c.items.trim() ? `${label} (${c.items.trim()})` : label;
    });
}

/** (Sub)processors appear among the data recipients — never as controllers. */
function recipientBullets(a: Answers): string[] {
  const processorLines = a.usesProcessors
    ? a.processors
        .filter((p) => p.name.trim())
        .map((p) => `${p.name} (data ${p.kind === 'subprocessor' ? 'sub-processor' : 'processor'}${p.contact.trim() ? `; contact: ${p.contact.trim()}` : ''})`)
    : [];
  return [...a.recipientsInternal, ...a.recipientsExternal, ...processorLines];
}

const BASIS_ORDER: LegalBasis[] = ['contract', 'consent', 'legitimateInterest', 'legalObligation'];

export function assemblePolicy(a: Answers): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  const g = { groupName: a.controller.name, address: a.controller.address, activityTitle: a.activityTitle || 'the event' };
  const isJoint = a.controllerKind === 'joint';
  const isParticipants = a.audience === 'participants';
  const audDev = isParticipants ? 'audience-adaptation (user decision A) — verbatim volunteer original in clause library' : undefined;

  const push = (b: Omit<PolicyBlock, 'removed'>) => blocks.push(b);

  /* The review notice and generator footer live in the app UI only (user decision
     2026-07-10): the published policy is read by data subjects, who should not see
     generator provenance. Template version + date go into DOCX metadata instead. */

  /* ---------- Title + last-updated line ---------- */
  push({
    id: 'title', kind: 'title',
    text: `Privacy Policy – ${a.activityTitle || '…'}`,
    locked: true,
    source: 'Annex 4 title (highlighted word "Template" replaced by the event name, user decision 2026-07-10)',
  });
  push({
    id: 'last-updated', kind: 'paragraph',
    text: `Last updated: ${a.policyDate} · Version ${a.version}`,
    locked: true, source: 'Annex 4 version line · LeCercle layout ("Last updated")',
  });

  /* ---------- Table of contents (LeCercle layout enhancement) ---------- */
  const tocEntries = [
    'Summary', 'Who we are', 'Personal data we process', 'Purposes of the Processing', 'Your rights',
    'More details',
    '1 - About us', '2 - Personal Data Collection', '3 - Legal Basis and Purposes', '4 - Data Retention',
    '5 - Data Transfers & Sharing', '6 - Data Security', '7 - Your Rights',
    '8 - Changes to this Privacy Policy', '9 - Contact Us',
  ];
  push({
    id: 'toc', kind: 'toc', entries: tocEntries, locked: true,
    source: 'LeCercle Supporters policy layout (table of contents)', deviation: 'lecercle-enhancement',
  });

  /* ---------- Summary Section ---------- */
  push({ id: 'sum-h', kind: 'heading1', text: 'Summary', locked: true, source: SRC.A4_SUMMARY });

  push({ id: 'sum-who-h', kind: 'heading2', text: SUMMARY.whoWeAreHeading, locked: true, source: SRC.A4_SUMMARY });
  push({
    id: 'sum-who', kind: 'paragraph',
    text: fill(isJoint ? SUMMARY.whoWeAreJoint : SUMMARY.whoWeAreController, { groupName: g.groupName, jointName: a.jointController.name }),
    locked: true, source: `${SRC.A4_SUMMARY} · ${SRC.HB_42} (Column F)`,
    deviation: isJoint ? 'joint-controller-adaptation (Ch. 4.2 requires joint-controllers’ details)' : undefined,
  });
  push({ id: 'sum-who-contact', kind: 'bullets', bullets: contactBullets(a), locked: false, source: `${SRC.A4_SUMMARY} · ${SRC.HB_42} (Column F)` });

  push({ id: 'sum-data-h', kind: 'heading2', text: SUMMARY.personalDataHeading, locked: true, source: SRC.A4_SUMMARY });
  push({ id: 'sum-data', kind: 'bullets', bullets: enabledCategoryBullets(a), locked: false, source: `${SRC.A4_SUMMARY} · ${SRC.HB_42} (Column I)` });

  push({ id: 'sum-purp-h', kind: 'heading2', text: SUMMARY.purposesHeading, locked: true, source: SRC.A4_SUMMARY });
  push({
    id: 'sum-purp', kind: 'bullets',
    bullets: a.purposes.filter((p) => p.enabled).map((p) => p.text),
    locked: false, source: `${SRC.A4_SUMMARY} · ${SRC.HB_42} (Column C)`,
  });

  push({ id: 'sum-rights-h', kind: 'heading2', text: SUMMARY.rightsHeading, locked: true, source: SRC.A4_SUMMARY });
  push({ id: 'sum-rights-i', kind: 'paragraph', text: SUMMARY.rightsIntro, locked: true, source: `${SRC.A4_SUMMARY} · ${SRC.HB_42}: “Leave section as it is”` });
  push({ id: 'sum-rights', kind: 'bullets', bullets: SUMMARY.rightsBullets, locked: true, source: `${SRC.A4_SUMMARY} · ${SRC.HB_42}: “Leave section as it is”` });

  /* ---------- Detailed Section ---------- */
  // "More details" alone bridges to the detailed part — the event title is not repeated
  // here (user feedback 2026-07-10: it duplicated the main title).
  push({ id: 'sum-more-h', kind: 'heading1', text: SUMMARY.moreDetailsHeading, locked: true, source: SRC.A4_SUMMARY });

  /* 1 - About us */
  push({ id: 's1-h', kind: 'heading2', text: S1_ABOUT_US.heading, locked: true, source: SRC.A4_S1 });
  push({
    id: 's1-welcome', kind: 'paragraph',
    text: fill(isParticipants ? S1_ABOUT_US.welcomeParticipants : S1_ABOUT_US.welcomeVolunteers, g),
    locked: true, source: `${SRC.A4_S1} · ${SRC.HB_42}`, deviation: audDev,
  });
  push({
    id: 's1-managed', kind: 'paragraph',
    text: fill(isJoint ? S1_ABOUT_US.managedByJoint : S1_ABOUT_US.managedByController, {
      ...g, jointName: a.jointController.name, jointAddress: a.jointController.address,
    }),
    locked: true, source: `${SRC.A4_S1} · ${SRC.HB_42} (Column F)`,
    deviation: isJoint ? 'joint-controller-adaptation (Ch. 4.2 “About us”; Art. 26(3) GDPR)' : undefined,
  });
  const solePurposeTexts = isJoint
    ? a.purposes.filter((p) => p.enabled && a.soleControllerPurposeIds.includes(p.id)).map((p) => p.text)
    : [];
  if (solePurposeTexts.length > 0) {
    // Purposes are selected from the §3 purposes list, keeping §1 and §3 consistent.
    push({
      id: 's1-sole', kind: 'paragraph',
      text: fill(S1_ABOUT_US.soleControllerPurposes, { groupName: g.groupName, purposes: solePurposeTexts.join('; ') }),
      locked: false, source: `${SRC.HB_42} “About us (if applicable)” (Column C where Column F = Controller)`,
      deviation: 'joint-controller-adaptation',
    });
  }
  push({ id: 's1-gdpr', kind: 'paragraph', text: S1_ABOUT_US.gdprDefinitions, locked: true, source: SRC.A4_S1 });
  push({ id: 's1-applies-i', kind: 'paragraph', text: S1_ABOUT_US.appliesToIntro, locked: true, source: SRC.A4_S1 });
  const subjects = [...a.dataSubjects, ...(a.dataSubjectsOther.trim() ? [a.dataSubjectsOther.trim()] : [])];
  push({
    id: 's1-applies', kind: 'bullets',
    bullets: subjects.map((s) => fill(S1_ABOUT_US.appliesToItem, { dataSubjects: s })),
    locked: false, source: `${SRC.A4_S1} · Handbook Ch. 3.4.2`,
  });
  if (a.dpoContact.trim()) {
    push({
      id: 's1-dpo', kind: 'paragraph',
      text: fill(S1_ABOUT_US.dpoLine, { dpoContact: a.dpoContact.trim() }),
      locked: false, source: `${SRC.BRIEF_12} item 2 (GDPR Art. 13(1)(b))`, deviation: 'brief-item-2 (optional DPO line, not in Annex 4)',
    });
  }

  /* 2 - Personal Data Collection */
  push({ id: 's2-h', kind: 'heading2', text: S2_COLLECTION.heading, locked: true, source: SRC.A4_S2 });
  push({ id: 's2a-h', kind: 'heading3', text: S2_COLLECTION.catHeading, locked: true, source: SRC.A4_S2 });
  push({
    id: 's2a-intro', kind: 'paragraph',
    text: fill(isParticipants ? S2_COLLECTION.catIntroParticipants : S2_COLLECTION.catIntroVolunteers, g),
    locked: true, source: `${SRC.A4_S2} · ${SRC.HB_42} (Column I)`, deviation: audDev,
  });
  push({ id: 's2a-list', kind: 'bullets', bullets: enabledCategoryBullets(a), locked: false, source: `${SRC.A4_S2} “[copy list from above]” · ${SRC.HB_42} (Column I)` });
  push({
    id: 's2a-noobl', kind: 'paragraph',
    text: fill(isParticipants ? S2_COLLECTION.noObligationParticipants : S2_COLLECTION.noObligationVolunteers, g),
    locked: true, source: `${SRC.A4_S2} · GDPR Art. 13(2)(e)`, deviation: audDev,
  });
  push({ id: 's2b-h', kind: 'heading3', text: S2_COLLECTION.howHeading, locked: true, source: SRC.A4_S2 });
  push({
    id: 's2b-intro', kind: 'paragraph',
    text: fill(isParticipants ? S2_COLLECTION.howIntroParticipants : S2_COLLECTION.howIntroVolunteers, g),
    locked: true, source: `${SRC.A4_S2} · ${SRC.HB_42} (Columns J–K)`, deviation: audDev,
  });
  push({ id: 's2b-intro2', kind: 'paragraph', text: S2_COLLECTION.howIntro2, locked: true, source: SRC.A4_S2 });
  if (a.directSources.length > 0) {
    push({ id: 's2b-dir-h', kind: 'heading3', text: S2_COLLECTION.directHeading, locked: true, source: SRC.A4_S2 });
    push({ id: 's2b-dir', kind: 'bullets', bullets: a.directSources, locked: false, source: `${SRC.A4_S2} · ROPA Column K` });
  }
  if (a.indirectSources.length > 0) {
    push({ id: 's2b-ind-h', kind: 'heading3', text: S2_COLLECTION.indirectHeading, locked: true, source: SRC.A4_S2 });
    push({ id: 's2b-ind', kind: 'bullets', bullets: a.indirectSources, locked: false, source: `${SRC.A4_S2} · ROPA Column K` });
  }

  /* 3 - Legal Basis and Purposes — intro + optional ADM statement first, then the
     basis/purposes TABLE (user request 2026-07-10; wording stays verbatim, only the
     presentation is tabular). Bases without Annex 4 lead-in wording are never
     rendered — surfaced as advice instead (F5). */
  push({ id: 's3-h', kind: 'heading2', text: S3_LEGAL_BASIS.heading, locked: true, source: SRC.A4_S3 });
  push({ id: 's3-intro', kind: 'paragraph', text: S3_LEGAL_BASIS.intro, locked: true, source: SRC.A4_S3 });
  if (a.includeNoAutomatedDecisions) {
    push({
      id: 's3-noadm', kind: 'paragraph', text: S3_LEGAL_BASIS.noAutomatedDecisions, locked: false,
      source: `${SRC.BRIEF_12} item 12 (GDPR Art. 13(2)(f))`, deviation: 'brief-item-12 (optional statement, not in Annex 4)',
    });
  }
  const basisRows = BASIS_ORDER.flatMap((basis) => {
    const purposes = a.purposes.filter((p) => p.enabled && p.basis === basis);
    if (purposes.length === 0) return [];
    const leadIn =
      basis === 'contract' ? (isParticipants ? S3_LEGAL_BASIS.contractParticipants : S3_LEGAL_BASIS.contractVolunteers) :
      basis === 'consent' ? S3_LEGAL_BASIS.consent :
      basis === 'legitimateInterest' ? S3_LEGAL_BASIS.legitimateInterest :
      S3_LEGAL_BASIS.legalObligation;
    const filled = fill(leadIn, g);
    const sep = filled.indexOf(':');
    return [{ label: filled.slice(0, sep), lead: filled.slice(sep + 1).trim(), purposes: purposes.map((p) => p.text) }];
  });
  push({
    id: 's3-table', kind: 'basisTable', rows: basisRows, locked: false,
    source: `${SRC.A4_S3} (verbatim lead-ins) · ${SRC.HB_42} (Column C per L–R) · tabular presentation per user decision 2026-07-10`,
  });
  if (a.purposes.some((p) => p.enabled && p.basis === 'consent')) {
    push({
      id: 's3-withdraw', kind: 'paragraph',
      text: fill(S3_LEGAL_BASIS.consentWithdrawal, { controllerEmail: a.controller.email }),
      locked: true, source: 'LeCercle Supporters policy §3 (approved wording)', deviation: 'lecercle-enhancement',
    });
  }
  if (a.purposes.some((p) => p.enabled && p.basis === 'legitimateInterest')) {
    push({
      id: 's3-object', kind: 'paragraph',
      text: fill(S3_LEGAL_BASIS.legitimateInterestObjection, { controllerEmail: a.controller.email }),
      locked: true, source: 'LeCercle Supporters policy §3 (approved wording)', deviation: 'lecercle-enhancement',
    });
  }

  /* 4 - Data Retention (fixed; optional indicative periods per the approved LeCercle pattern) */
  push({ id: 's4-h', kind: 'heading2', text: S4_RETENTION.heading, locked: true, source: SRC.A4_S4 });
  push({ id: 's4', kind: 'paragraph', text: S4_RETENTION.body, locked: true, source: `${SRC.A4_S4} · ${SRC.HB_42}: “Leave section as it is”` });
  const retentionRows = a.retentionPeriods.filter((r) => r.label.trim() && r.period.trim());
  if (retentionRows.length > 0) {
    push({
      id: 's4-ind-i', kind: 'paragraph', text: S4_RETENTION.indicativeIntro, locked: true,
      source: 'LeCercle Supporters policy §4 (approved wording)', deviation: 'lecercle-enhancement (optional)',
    });
    push({
      id: 's4-ind', kind: 'bullets',
      bullets: retentionRows.map((r) => `${r.label.trim()}: ${r.period.trim()}`),
      locked: false, source: 'Officer input · pattern from the approved LeCercle policy §4',
      deviation: 'lecercle-enhancement (optional)',
    });
  }

  /* 5 - Data Transfers & Sharing */
  push({ id: 's5-h', kind: 'heading2', text: S5_TRANSFERS.heading, locked: true, source: SRC.A4_S5 });
  push({ id: 's5a-h', kind: 'heading3', text: S5_TRANSFERS.recipientsHeading, locked: true, source: SRC.A4_S5 });
  push({ id: 's5a-intro', kind: 'paragraph', text: S5_TRANSFERS.recipientsIntro, locked: true, source: SRC.A4_S5 });
  push({ id: 's5a-li', kind: 'paragraph', text: S5_TRANSFERS.recipientsListIntro, locked: true, source: SRC.A4_S5 });
  push({
    id: 's5a-list', kind: 'bullets',
    bullets: recipientBullets(a),
    locked: false,
    source: `${SRC.A4_S5} “[insert third parties]” · ${SRC.HB_42} (Columns Z–AC; controllers themselves are not listed)`,
  });

  if (a.transfersOutsideEEA === true) {
    // Safety: an "international organisation" entered under countries (or vice versa)
    // is rendered in the correct list — orgs are never presented as countries.
    const tcCountries = a.thirdCountries.filter((c) => !INTERNATIONAL_ORG_RE.test(c));
    const tcOrgs = [...a.internationalOrgs, ...a.thirdCountries.filter((c) => INTERNATIONAL_ORG_RE.test(c) && !a.internationalOrgs.includes(c))];
    push({ id: 's5b-h', kind: 'heading3', text: S5_TRANSFERS.thirdCountryHeading, locked: true, source: `${SRC.A4_S5} · conditional per ${SRC.HB_42}` });
    push({ id: 's5b-1', kind: 'paragraph', text: S5_TRANSFERS.tcIntro, locked: true, source: SRC.A4_S5 });
    push({ id: 's5b-2', kind: 'paragraph', text: S5_TRANSFERS.tcSafeguards, locked: true, source: SRC.A4_S5 });
    push({ id: 's5b-3', kind: 'bullets', bullets: S5_TRANSFERS.tcSafeguardBullets, locked: true, source: `${SRC.A4_S5} (SCC citation from .docx hyperlink)` });
    if (tcCountries.length > 0) {
      push({ id: 's5b-4', kind: 'paragraph', text: S5_TRANSFERS.tcCountriesIntro, locked: true, source: SRC.A4_S5 });
      push({ id: 's5b-5', kind: 'bullets', bullets: tcCountries, locked: false, source: `${SRC.A4_S5} · ROPA Column AF` });
    }
    if (tcOrgs.length > 0) {
      push({ id: 's5b-6', kind: 'paragraph', text: S5_TRANSFERS.tcOrgsIntro, locked: true, source: SRC.A4_S5 });
      push({ id: 's5b-7', kind: 'bullets', bullets: tcOrgs, locked: false, source: `${SRC.A4_S5} · ROPA Column AC` });
    }
    push({
      id: 's5b-8', kind: 'paragraph',
      text: fill(S5_TRANSFERS.tcSccCopy, { sccContactEmail: a.sccContactEmail || a.controller.email }),
      locked: true, source: SRC.A4_S5,
    });
    push({ id: 's5b-9', kind: 'paragraph', text: S5_TRANSFERS.tcConsentFallback, locked: true, source: SRC.A4_S5 });
  }

  push({ id: 's5c-h', kind: 'heading3', text: S5_TRANSFERS.disclosureHeading, locked: true, source: SRC.A4_S5 });
  push({ id: 's5c-i', kind: 'paragraph', text: S5_TRANSFERS.disclosureIntro, locked: true, source: SRC.A4_S5 });
  push({ id: 's5c-list', kind: 'bullets', bullets: S5_TRANSFERS.disclosureBullets, locked: true, source: SRC.A4_S5 });

  /* 6 - Data Security (fixed) */
  push({ id: 's6-h', kind: 'heading2', text: S6_SECURITY.heading, locked: true, source: SRC.A4_S6 });
  S6_SECURITY.paragraphs.forEach((p, i) =>
    push({ id: `s6-${i}`, kind: 'paragraph', text: p, locked: true, source: `${SRC.A4_S6} · ${SRC.HB_42}: “Leave section as it is”` }),
  );

  /* 7 - Your Rights (fixed; contact adaptation per user decision C) */
  push({ id: 's7-h', kind: 'heading2', text: S7_RIGHTS.heading, locked: true, source: SRC.A4_S7 });
  push({
    id: 's7-intro', kind: 'paragraph',
    text: fill(S7_RIGHTS.intro, { controllerEmail: a.controller.email }),
    locked: true, source: `${SRC.A4_S7} (secgen@elsa.org from .docx hyperlink)`,
    deviation: 'contact-adaptation (user decision C: controller e-mail first, secgen@ kept)',
  });
  push({ id: 's7-list', kind: 'bullets', bullets: S7_RIGHTS.bullets, locked: true, source: `${SRC.A4_S7} · ${SRC.HB_42}: “Leave section as it is”` });
  push({ id: 's7-resp', kind: 'paragraph', text: S7_RIGHTS.responseTime, locked: true, source: SRC.A4_S7 });

  /* 8 - Changes */
  push({ id: 's8-h', kind: 'heading2', text: S8_CHANGES.heading, locked: true, source: SRC.A4_S8 });
  S8_CHANGES.paragraphs.forEach((p, i) =>
    push({
      id: `s8-${i}`, kind: 'paragraph',
      text: fill(p, { noticeDays: String(a.noticeDays) }),
      locked: true, source: `${SRC.A4_S8}${p.includes('{{noticeDays}}') ? ` · ${SRC.HB_42}: check days are reasonable` : ''}`,
    }),
  );

  /* 9 - Contact Us */
  push({ id: 's9-h', kind: 'heading2', text: S9_CONTACT.heading, locked: true, source: SRC.A4_S9 });
  push({ id: 's9-i', kind: 'paragraph', text: S9_CONTACT.intro, locked: true, source: SRC.A4_S9 });
  push({
    id: 's9-c', kind: 'bullets',
    bullets: [
      `the European Law Students’ Association (ELSA) ${a.controller.name}`,
      a.controller.address,
      [a.controller.email, ...a.extraEmails.filter((e) => e.trim())].filter(Boolean).join(', '),
      ...(isJoint && a.jointController.name.trim()
        ? [`${a.jointController.name}${a.jointController.address ? `, ${a.jointController.address}` : ''}${a.jointController.email ? `, ${a.jointController.email}` : ''}`]
        : []),
    ].filter(Boolean),
    locked: false, source: `${SRC.A4_S9} · ${SRC.HB_42} (Column F)`,
  });

  return blocks;
}

/** Apply the officer's compose-step edits (removals + per-section bullet order/edits). Locked blocks pass through untouched. */
export function applyEdits(
  blocks: PolicyBlock[],
  edits: Record<string, { removed?: boolean; bullets?: string[]; text?: string }>,
): PolicyBlock[] {
  return blocks
    .map((b) => {
      const e = edits[b.id];
      if (!e || b.locked) return b;
      return {
        ...b,
        removed: e.removed ?? b.removed,
        bullets: e.bullets ?? b.bullets,
        text: e.text ?? b.text,
      };
    })
    .filter((b) => !b.removed);
}

export function basisLabel(basis: LegalBasis): string {
  return LEGAL_BASIS_DEFS.find((d) => d.id === basis)?.label ?? basis;
}
