/**
 * Core types for the elsaiprivacypolicy generator.
 * The legal logic lives in data files (clauses, picklists) — see src/data/.
 */

export type Audience = 'volunteers' | 'participants';

export type LegalBasis =
  | 'contract'
  | 'consent'
  | 'legitimateInterest'
  | 'legalObligation'
  | 'publicInterest'
  | 'vitalInterests';

export interface ControllerContact {
  name: string; // e.g. "The Netherlands" or "Leuven" — rendered as "ELSA <name>"
  address: string;
  email: string;
  phone: string;
}

export interface DataCategorySelection {
  id: string;
  /** Exact data items shown in parentheses/bullets — editable per event. */
  items: string;
  enabled: boolean;
}

export interface Purpose {
  id: string;
  text: string;
  basis: LegalBasis;
  enabled: boolean;
}

export interface Answers {
  activityTitle: string;
  audience: Audience;
  controllerKind: 'controller' | 'joint';
  controller: ControllerContact;
  jointController: ControllerContact;
  /** Joint-controller case: purposes for which the group acts as sole controller (Ch. 4.2 "About us (if applicable)"). */
  soleControllerPurposes: string;
  controllerCountry: string; // ISO code, for supervisory-authority advice
  dpoContact: string; // optional (brief §12 item 2)
  dataSubjects: string[];
  dataSubjectsOther: string;
  dataCategories: DataCategorySelection[];
  directSources: string[];
  indirectSources: string[];
  purposes: Purpose[];
  recipientsInternal: string[];
  recipientsExternal: string[];
  transfersOutsideEEA: boolean | null;
  thirdCountries: string[];
  internationalOrgs: string[];
  sccContactEmail: string;
  noticeDays: number;
  minorsInvolved: boolean;
  includeNoAutomatedDecisions: boolean;
  /** Art. 9 safeguard: officer confirmed explicit consent will be collected for special-category data. */
  explicitConsentConfirmed: boolean;
  policyDate: string; // ISO yyyy-mm-dd
  version: string;
  /** JotForm link kept for the officer's reference (not fetched — see README). */
  jotformLink: string;
}

/** One rendered block of the assembled policy. */
export interface PolicyBlock {
  id: string;
  kind: 'title' | 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullets' | 'notice';
  text?: string;
  bullets?: string[];
  /** Fixed text can never be edited/removed at runtime. */
  locked: boolean;
  /** Whether the officer removed this optional block in the compose step. */
  removed?: boolean;
  source: string; // Annex 4 + Handbook reference (traceability, brief §2.6)
  deviation?: string; // marked adaptations, e.g. 'audience-adaptation'
}

export interface AnalysisSuggestion {
  field: string;
  label: string;
  value: string;
  /** Why the analyser suggested it — the matched evidence from the pasted text. */
  evidence: string;
  accepted: boolean | null;
}

export interface Advice {
  level: 'info' | 'action' | 'contact';
  title: string;
  body: string;
}
