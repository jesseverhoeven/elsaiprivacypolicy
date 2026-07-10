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
import { DATA_CATEGORY_DEFS, LEGAL_BASIS_DEFS } from '../data/picklists';

function contactBullets(a: Answers): string[] {
  const lines = [
    `Address: ${a.controller.address}`,
    `E-mail: ${a.controller.email}`,
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
      const label = def?.label ?? c.id;
      return c.items.trim() ? `${label} (${c.items.trim()})` : label;
    });
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

  /* ---------- Title ---------- */
  push({ id: 'title', kind: 'title', text: 'Privacy Policy', locked: true, source: 'Annex 4 title (highlighted word "Template" removed)' });

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

  push({ id: 'sum-more-h', kind: 'heading2', text: SUMMARY.moreDetailsHeading, locked: true, source: SRC.A4_SUMMARY });

  /* ---------- Detailed Section ---------- */
  push({
    id: 'det-h', kind: 'heading1',
    text: `Privacy Policy for ${a.activityTitle || '…'}`,
    locked: false, source: 'Annex 4 Detailed heading · user decision B (audience/event placeholder)',
    deviation: 'heading names the event instead of the template’s example audience',
  });
  push({
    id: 'det-version', kind: 'paragraph',
    text: `Version ${a.version} - ${a.policyDate}`,
    locked: true, source: 'Annex 4 “Version 0 - 00.00.0000” placeholder',
  });

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
  if (isJoint && a.soleControllerPurposes.trim()) {
    push({
      id: 's1-sole', kind: 'paragraph',
      text: fill(S1_ABOUT_US.soleControllerPurposes, { groupName: g.groupName, purposes: a.soleControllerPurposes.trim() }),
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

  /* 3 - Legal Basis and Purposes */
  push({ id: 's3-h', kind: 'heading2', text: S3_LEGAL_BASIS.heading, locked: true, source: SRC.A4_S3 });
  push({ id: 's3-intro', kind: 'paragraph', text: S3_LEGAL_BASIS.intro, locked: true, source: SRC.A4_S3 });
  for (const basis of BASIS_ORDER) {
    const purposes = a.purposes.filter((p) => p.enabled && p.basis === basis);
    if (purposes.length === 0) continue;
    const leadIn =
      basis === 'contract' ? (isParticipants ? S3_LEGAL_BASIS.contractParticipants : S3_LEGAL_BASIS.contractVolunteers) :
      basis === 'consent' ? S3_LEGAL_BASIS.consent :
      basis === 'legitimateInterest' ? S3_LEGAL_BASIS.legitimateInterest :
      S3_LEGAL_BASIS.legalObligation;
    push({
      id: `s3-${basis}`, kind: 'paragraph', text: fill(leadIn, g), locked: true,
      source: `${SRC.A4_S3} · ${SRC.HB_42} (Column C per L–R)`,
      deviation: basis === 'contract' ? audDev : undefined,
    });
    push({ id: `s3-${basis}-list`, kind: 'bullets', bullets: purposes.map((p) => p.text), locked: false, source: `${SRC.A4_S3} “[purpose]” · ROPA Column C` });
  }
  // Bases without Annex 4 lead-in wording are never rendered — surfaced as advice instead (F5).
  if (a.includeNoAutomatedDecisions) {
    push({
      id: 's3-noadm', kind: 'paragraph', text: S3_LEGAL_BASIS.noAutomatedDecisions, locked: false,
      source: `${SRC.BRIEF_12} item 12 (GDPR Art. 13(2)(f))`, deviation: 'brief-item-12 (optional statement, not in Annex 4)',
    });
  }

  /* 4 - Data Retention (fixed) */
  push({ id: 's4-h', kind: 'heading2', text: S4_RETENTION.heading, locked: true, source: SRC.A4_S4 });
  push({ id: 's4', kind: 'paragraph', text: S4_RETENTION.body, locked: true, source: `${SRC.A4_S4} · ${SRC.HB_42}: “Leave section as it is”` });

  /* 5 - Data Transfers & Sharing */
  push({ id: 's5-h', kind: 'heading2', text: S5_TRANSFERS.heading, locked: true, source: SRC.A4_S5 });
  push({ id: 's5a-h', kind: 'heading3', text: S5_TRANSFERS.recipientsHeading, locked: true, source: SRC.A4_S5 });
  push({ id: 's5a-intro', kind: 'paragraph', text: S5_TRANSFERS.recipientsIntro, locked: true, source: SRC.A4_S5 });
  push({ id: 's5a-li', kind: 'paragraph', text: S5_TRANSFERS.recipientsListIntro, locked: true, source: SRC.A4_S5 });
  push({
    id: 's5a-list', kind: 'bullets',
    bullets: [...a.recipientsInternal, ...a.recipientsExternal],
    locked: false,
    source: `${SRC.A4_S5} “[insert third parties]” · ${SRC.HB_42} (Columns Z–AC; controllers themselves are not listed)`,
  });

  if (a.transfersOutsideEEA === true) {
    push({ id: 's5b-h', kind: 'heading3', text: S5_TRANSFERS.thirdCountryHeading, locked: true, source: `${SRC.A4_S5} · conditional per ${SRC.HB_42}` });
    push({ id: 's5b-1', kind: 'paragraph', text: S5_TRANSFERS.tcIntro, locked: true, source: SRC.A4_S5 });
    push({ id: 's5b-2', kind: 'paragraph', text: S5_TRANSFERS.tcSafeguards, locked: true, source: SRC.A4_S5 });
    push({ id: 's5b-3', kind: 'bullets', bullets: S5_TRANSFERS.tcSafeguardBullets, locked: true, source: `${SRC.A4_S5} (SCC citation from .docx hyperlink)` });
    if (a.thirdCountries.length > 0) {
      push({ id: 's5b-4', kind: 'paragraph', text: S5_TRANSFERS.tcCountriesIntro, locked: true, source: SRC.A4_S5 });
      push({ id: 's5b-5', kind: 'bullets', bullets: a.thirdCountries, locked: false, source: `${SRC.A4_S5} · ROPA Column AF` });
    }
    if (a.internationalOrgs.length > 0) {
      push({ id: 's5b-6', kind: 'paragraph', text: S5_TRANSFERS.tcOrgsIntro, locked: true, source: SRC.A4_S5 });
      push({ id: 's5b-7', kind: 'bullets', bullets: a.internationalOrgs, locked: false, source: `${SRC.A4_S5} · ROPA Column AC` });
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
      a.controller.email,
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
