/**
 * Gap analysis + safeguards. Determines (deterministically) which required
 * information is still missing, whether Art. 9 special-category handling is
 * triggered (HB Ch. 1.6.2), and what calm follow-up advice to show — pointing to
 * dataprotection@elsa.org only when something genuinely needs it.
 */

import type { Answers, Advice } from '../types';
import { DATA_CATEGORY_DEFS, LEGAL_BASIS_DEFS } from '../data/picklists';
import { authorityFor } from '../data/supervisoryAuthorities';

export interface Gap {
  field: string;
  label: string;
  why: string;
  blocking: boolean;
}

export function specialCategoriesSelected(a: Answers): string[] {
  return a.dataCategories
    .filter((c) => c.enabled)
    .map((c) => DATA_CATEGORY_DEFS.find((d) => d.id === c.id))
    .filter((d) => d?.special)
    .map((d) => d!.label);
}

export function findGaps(a: Answers): Gap[] {
  const gaps: Gap[] = [];
  const add = (field: string, label: string, why: string, blocking = true) =>
    gaps.push({ field, label, why, blocking });

  if (!a.controller.name.trim()) add('controller.name', 'Name of your ELSA group', 'Names the data controller (Annex 4 “Who we are” / §1 / §9).');
  if (!a.controller.address.trim()) add('controller.address', 'Postal address of your group', 'Required controller contact detail (Handbook Ch. 4.2: Name/Organisation, Address, E-Mail, Phone).');
  if (!a.controller.email.trim()) add('controller.email', 'Contact e-mail of your group', 'Required controller contact detail; also used for rights requests (§7).');
  if (!a.controller.phone.trim()) add('controller.phone', 'Phone number of your group', 'Required controller contact detail (Handbook Ch. 4.2).', false);
  if (!a.activityTitle.trim()) add('activityTitle', 'Name of the event / processing activity', 'Customises the policy title and audience wording (e.g. “organisation of an NCM”).');
  if (a.controllerKind === 'joint') {
    if (!a.jointController.name.trim()) add('jointController.name', 'Name of the joint controller', 'You indicated joint controllership; both controllers must be named (Handbook Ch. 4.2 “About us”).');
    if (!a.jointController.address.trim()) add('jointController.address', 'Address of the joint controller', 'Joint-controller contact details (Handbook Ch. 4.2).', false);
  }
  if (!a.controllerCountry) add('controllerCountry', 'Country of your group', 'Used to name your national supervisory authority in the follow-up advice.', false);
  if (a.dataSubjects.length === 0 && !a.dataSubjectsOther.trim())
    add('dataSubjects', 'Whose data is processed (data subjects)', 'Fills “This Policy applies to …” in §1 (Handbook Ch. 3.4.2).');
  if (!a.dataCategories.some((c) => c.enabled))
    add('dataCategories', 'Categories of personal data collected', 'Fills “Personal data we process” (Summary + §2a, ROPA Column I).');
  if (a.directSources.length === 0 && a.indirectSources.length === 0)
    add('sources', 'How the data is collected (specific sources)', 'Fills §2b “How we collect personal data” — direct vs indirect (ROPA Columns J–K).');
  if (!a.purposes.some((p) => p.enabled))
    add('purposes', 'Purposes of the processing', 'Fills the Summary purposes and §3, grouped by legal basis (ROPA Column C, sections L–R).');
  if (a.recipientsInternal.length === 0 && a.recipientsExternal.length === 0)
    add('recipients', 'Who receives the data (recipients)', 'Fills §5a Data Recipients (ROPA Columns Z–AC).', false);
  if (a.transfersOutsideEEA === null)
    add('transfersOutsideEEA', 'Is data transferred outside the EEA or to international organisations?', 'Decides whether §5b (Third-Country and International Organisation Transfers) is included.');
  if (a.transfersOutsideEEA === true && a.thirdCountries.length === 0 && a.internationalOrgs.length === 0)
    add('thirdCountries', 'Which countries / international organisations', '§5b must name all countries and organisations (Handbook Ch. 3.4.4 / 4.2).');

  // Art. 9 safeguard (HB Ch. 1.6.2): special categories require explicit consent.
  const special = specialCategoriesSelected(a);
  if (special.length > 0) {
    if (!a.explicitConsentConfirmed)
      add('explicitConsent', `Explicit consent for: ${special.join(', ')}`,
        'Special-category (Art. 9) data is generally prohibited to process; within ELSA the applicable exception is the individual’s explicit consent (Handbook Ch. 1.6.2). Confirm explicit consent will be collected.');
    const consentPurpose = a.purposes.some((p) => p.enabled && p.basis === 'consent');
    if (!consentPurpose)
      add('consentPurpose', 'A purpose under the legal basis “Consent”',
        'Special-category data relies on explicit consent, so at least one purpose must be listed under Consent in §3 (Handbook Ch. 1.6.2 + 4.2).');
  }

  return gaps;
}

/** Can a complete policy be generated at all? */
export function blockingGaps(a: Answers): Gap[] {
  return findGaps(a).filter((g) => g.blocking);
}

/** Follow-up advice for the export step — calm, only what genuinely needs attention. */
export function buildAdvice(a: Answers): Advice[] {
  const advice: Advice[] = [];
  const special = specialCategoriesSelected(a);

  if (special.length > 0) {
    advice.push({
      level: 'action',
      title: 'Collect explicit consent for special-category data',
      body:
        `This event processes ${special.join(' and ')} — special-category data under Art. 9 GDPR. Make sure the ` +
        'registration form collects explicit consent for it, following the Handbook Ch. 4.3.2 consent-banner checklist ' +
        '(freely given, specific, informed, unambiguous, equal-prominence accept/reject, no pre-ticked boxes, easily withdrawn, plain language).',
    });
  }

  if (a.purposes.some((p) => p.enabled && p.basis === 'consent')) {
    advice.push({
      level: 'info',
      title: 'Consent banner where the data is collected',
      body:
        'Some purposes rely on consent. Publish this policy where the individual provides their information (e.g. the ' +
        'registration form) and include a consent banner there that meets the Handbook Ch. 4.3.2 checklist.',
    });
  }

  const unsupported = a.purposes.filter((p) => p.enabled && !LEGAL_BASIS_DEFS.find((b) => b.id === p.basis)?.annex4LeadIn);
  if (unsupported.length > 0) {
    advice.push({
      level: 'contact',
      title: 'Legal basis without template wording',
      body:
        `You selected the legal basis “${unsupported.map((p) => p.basis).join(', ')}” for some purposes. The Annex 4 template ` +
        'contains no fixed wording for this basis, and this tool never invents legal wording. Please contact ' +
        'dataprotection@elsa.org before publishing.',
    });
  }

  if (a.transfersOutsideEEA === true) {
    advice.push({
      level: 'info',
      title: 'Transfers outside the EEA',
      body:
        `Data goes to ${[...a.thirdCountries, ...a.internationalOrgs].join(', ') || 'third countries / international organisations'}. ` +
        'The policy includes the safeguards section (§5b: adequacy decisions / standard contractual clauses). Check that a ' +
        'data protection agreement or SCCs are actually in place with those recipients (Handbook Ch. 3.4.4); if unsure, ask dataprotection@elsa.org.',
    });
  }

  if (a.minorsInvolved) {
    const auth = authorityFor(a.controllerCountry);
    const age = auth ? `${auth.art8Age} (indicative — verify against the national source)` : 'the national digital-consent age';
    advice.push({
      level: 'action',
      title: 'Minors participate — parental/guardian authorisation',
      body:
        `You indicated minors may be involved. Where consent is the legal basis and a participant is below the digital-consent age of ${age} ` +
        `in ${auth?.country ?? 'your country'} (Art. 8 GDPR), consent must be given or authorised by a parent/guardian. Plan how you will ` +
        'obtain and verify this, and align with dataprotection@elsa.org.',
    });
  }

  const auth = authorityFor(a.controllerCountry);
  if (auth) {
    advice.push({
      level: 'info',
      title: 'Your supervisory authority',
      body:
        `For complaints, the competent authority for ${auth.country} is: ${auth.authority}.` +
        (auth.note ? ` ${auth.note}` : '') +
        (auth.separateFramework ? ` Note: ${auth.separateFramework}` : '') +
        ' (The policy’s fixed §7 links to the EDPB list of all authorities; this name is for your own reference.)',
    });
  }

  if (a.jotformLink.trim() || a.directSources.includes('JotForm') || a.directSources.some((s) => s.toLowerCase().includes('jotform'))) {
    advice.push({
      level: 'info',
      title: 'Publish the policy on the form',
      body:
        'Link or embed this privacy policy directly in the JotForm (or other form) where the data is collected, so ' +
        'participants read it before submitting (Handbook Ch. 4.3.2).',
    });
  }

  if (a.controllerKind === 'joint') {
    advice.push({
      level: 'info',
      title: 'Joint controllership (Art. 26 GDPR)',
      body:
        'With joint controllers, the essence of your arrangement (who answers rights requests, who informs data subjects) must be ' +
        'made available to data subjects, and they can exercise their rights against either controller. Make sure a joint-controller ' +
        'agreement exists; template questions go to dataprotection@elsa.org.',
    });
  }

  return advice;
}
