import type { Answers } from './types';
import { DATA_CATEGORY_DEFS, PURPOSE_SUGGESTIONS, SOURCE_OPTIONS, INTERNAL_RECIPIENT_OPTIONS, EXTERNAL_RECIPIENT_OPTIONS, DATA_SUBJECT_OPTIONS } from './data/picklists';
import type { AnalysisResult } from './logic/analyze';

export function defaultAnswers(): Answers {
  const today = new Date().toISOString().slice(0, 10);
  return {
    activityTitle: '',
    audience: 'participants',
    controllerKind: 'controller',
    controller: { name: '', address: '', email: '', phone: '' },
    jointController: { name: '', address: '', email: '', phone: '' },
    soleControllerPurposes: '',
    controllerCountry: '',
    dpoContact: '',
    dataSubjects: [],
    dataSubjectsOther: '',
    dataCategories: DATA_CATEGORY_DEFS.map((d) => ({ id: d.id, items: d.defaultItems, enabled: false })),
    directSources: [],
    indirectSources: [],
    purposes: PURPOSE_SUGGESTIONS.map((p, i) => ({ id: `p${i}`, text: p.text, basis: p.basis, enabled: false })),
    recipientsInternal: [],
    recipientsExternal: [],
    transfersOutsideEEA: null,
    thirdCountries: [],
    internationalOrgs: [],
    sccContactEmail: '',
    noticeDays: 7,
    minorsInvolved: false,
    includeNoAutomatedDecisions: true,
    explicitConsentConfirmed: false,
    policyDate: today,
    version: '1.0',
    jotformLink: '',
  };
}

/** Merge deterministic analysis into answers — analysis only pre-fills; the officer reviews everything in step 2. */
export function mergeAnalysis(a: Answers, r: AnalysisResult): Answers {
  const next: Answers = structuredClone(a);

  if (r.groupNames.length > 0 && !next.controller.name) next.controller.name = r.groupNames[0];
  if (r.emails.length > 0 && !next.controller.email) next.controller.email = r.emails[0];
  if (r.phones.length > 0 && !next.controller.phone) next.controller.phone = r.phones[0];
  if (r.activityTitleGuess && !next.activityTitle) next.activityTitle = r.activityTitleGuess;
  if (r.audienceGuess) next.audience = r.audienceGuess;
  if (r.jotformLinks.length > 0 && !next.jotformLink) next.jotformLink = r.jotformLinks[0];

  for (const id of r.dataSubjectIds) {
    const label = DATA_SUBJECT_OPTIONS.find((d) => d.id === id)?.label;
    if (label && !next.dataSubjects.includes(label)) next.dataSubjects.push(label);
  }
  for (const id of r.dataCategoryIds) {
    const cat = next.dataCategories.find((c) => c.id === id);
    if (cat) cat.enabled = true;
  }
  for (const id of r.sourceIds) {
    const label = SOURCE_OPTIONS.find((s) => s.id === id)?.label;
    if (label && !next.directSources.includes(label)) next.directSources.push(label);
  }
  for (const id of r.internalRecipientIds) {
    const label = INTERNAL_RECIPIENT_OPTIONS.find((s) => s.id === id)?.label;
    if (label && !next.recipientsInternal.includes(label)) next.recipientsInternal.push(label);
  }
  for (const id of r.externalRecipientIds) {
    const label = EXTERNAL_RECIPIENT_OPTIONS.find((s) => s.id === id)?.label;
    if (label && !next.recipientsExternal.includes(label)) next.recipientsExternal.push(label);
  }
  for (const text of r.purposeTexts) {
    const p = next.purposes.find((p) => p.text === text);
    if (p) p.enabled = true;
  }
  if (r.thirdCountries.length > 0) {
    next.transfersOutsideEEA = true;
    for (const c of r.thirdCountries) if (!next.thirdCountries.includes(c)) next.thirdCountries.push(c);
  }
  if (r.minorsSignal) next.minorsInvolved = true;
  if (!next.sccContactEmail && next.controller.email) next.sccContactEmail = next.controller.email;

  return next;
}
