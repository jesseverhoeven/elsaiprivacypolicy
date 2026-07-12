/**
 * Core types for the elsaiprivacypolicy generator.
 * The legal logic lives in data files (clauses, picklists) — see src/data/.
 */

/**
 * '' = not chosen (the default) — the policy then uses neutral wording that fits
 * both internal and external audiences (user decision 2026-07-12: never preselect;
 * neutral is the safest, most widely applicable phrasing).
 */
export type Audience = 'volunteers' | 'participants' | '';

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

/** A (sub)processor engaged by the controller — clearly distinct from a (joint) controller. */
export interface ProcessorEntry {
  name: string;
  kind: 'processor' | 'subprocessor';
  contact: string; // e-mail / address / other contact info
}

export interface DataCategorySelection {
  id: string;
  /** Exact data items shown in parentheses/bullets — editable per event. */
  items: string;
  enabled: boolean;
  /** Officer-added categories (id starts with "custom:"): the display label. */
  customLabel?: string;
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
  /** Additional controller e-mail addresses shown alongside the primary one. */
  extraEmails: string[];
  jointController: ControllerContact;
  /** (Sub)processors — listed as data recipients, never as controllers. */
  usesProcessors: boolean;
  processors: ProcessorEntry[];
  /**
   * Joint-controller case: ids of the selected purposes for which the group acts as
   * sole controller (Ch. 4.2 "About us (if applicable)") — chosen from the purposes
   * list, not free text, so §1 and §3 stay consistent.
   */
  soleControllerPurposeIds: string[];
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
  /**
   * Optional indicative retention periods (approved LeCercle pattern). Empty =
   * only the fixed Annex 4 retention text; the ROPA holds the specific periods.
   */
  retentionPeriods: { label: string; period: string }[];
  minorsInvolved: boolean;
  includeNoAutomatedDecisions: boolean;
  /** Art. 9 safeguard: officer confirmed explicit consent will be collected for special-category data. */
  explicitConsentConfirmed: boolean;
  policyDate: string; // ISO yyyy-mm-dd
  version: string;
  /** JotForm link kept for the officer's reference (not fetched — see README). */
  jotformLink: string;
  /** Preset event this policy started from (e.g. 'lecercle'), or null for a new event. */
  presetId: string | null;
  /** Officer's notes on what changed vs the preset's previous edition. */
  changeNotes: string;
}

/** One row of the §3 legal-basis table: basis name, verbatim lead-in, purposes. */
export interface BasisRow {
  label: string;
  lead: string;
  purposes: string[];
}

/** One rendered block of the assembled policy. */
export interface PolicyBlock {
  id: string;
  kind: 'title' | 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullets' | 'notice' | 'toc' | 'basisTable';
  text?: string;
  /** basisTable only: one row per legal basis (visual styling; wording unchanged). */
  rows?: BasisRow[];
  /** toc only: the section titles listed in the table of contents. */
  entries?: string[];
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
