/**
 * ELSA pick-lists, sourced verbatim from the ELSA Data Protection Handbook 25/26.
 * Source references use "HB" = Handbook chapter, "A4" = Annex 4 Template Privacy Policy.
 * Do not edit wording here without review by dataprotection@elsa.org — changes ship via git commit + redeploy.
 */

import type { LegalBasis } from '../types';

/** HB Ch. 3.4.2 — categories of data subjects. */
export const DATA_SUBJECT_OPTIONS: { id: string; label: string; audienceHint: 'volunteers' | 'participants' | null }[] = [
  { id: 'ng-reps', label: 'National/Local Group Representatives', audienceHint: 'volunteers' },
  { id: 'team-officers', label: 'National Group Team Officers', audienceHint: 'volunteers' },
  { id: 'intl-guests', label: 'International Guests', audienceHint: 'participants' },
  { id: 'chairs', label: 'Chairs', audienceHint: 'volunteers' },
  { id: 'auditors', label: 'Auditors', audienceHint: null },
  { id: 'board-reps', label: 'Representatives of the Board', audienceHint: 'volunteers' },
  { id: 'former-board', label: 'Representatives of former Boards for Relief of Responsibility', audienceHint: 'volunteers' },
  { id: 'alumni', label: 'Alumni', audienceHint: 'participants' },
  { id: 'partners', label: 'Partners', audienceHint: 'participants' },
  { id: 'speakers', label: 'Speakers', audienceHint: 'participants' },
  { id: 'emergency-contacts', label: 'Emergency Contacts of Participants', audienceHint: 'participants' },
  { id: 'participants', label: 'Participants of the project (and coaches of teams)', audienceHint: 'participants' },
  { id: 'panelists', label: 'Panelists', audienceHint: 'participants' },
];

export interface DataCategoryDef {
  id: string;
  label: string;
  /** Default exact data items — verbatim from A4 "Personal data we process" / HB Ch. 3.4.2. Editable per event. */
  defaultItems: string;
  /** GDPR Art. 9 special category (HB Ch. 1.6.2). */
  special: boolean;
  /** Deterministic analyser keywords (lower-case substring match). */
  keywords: string[];
}

/** A4 Summary "Personal data we process" + HB Ch. 3.4.2 — the 14 ELSA data categories, wording verbatim. */
export const DATA_CATEGORY_DEFS: DataCategoryDef[] = [
  {
    id: 'personal-identification', label: 'Personal identification', defaultItems: 'name, surname', special: false,
    keywords: ['name', 'surname', 'first name', 'last name', 'full name', 'date of birth', 'nationality'],
  },
  {
    id: 'contact-information', label: 'Contact information', defaultItems: 'e-mail address', special: false,
    keywords: ['e-mail', 'email', 'phone', 'telephone', 'mobile', 'contact detail', 'whatsapp'],
  },
  {
    id: 'financial-information', label: 'Financial information', defaultItems: 'IBAN, amounts', special: false,
    keywords: ['iban', 'payment', 'bank', 'fee', 'invoice', 'reimbursement', 'price', 'paypal', 'credit card'],
  },
  {
    id: 'elsa-activity', label: 'ELSA Activity', defaultItems: 'ELSA Position, National Group of origin, Alumni Status', special: false,
    keywords: ['elsa position', 'national group', 'local group', 'alumni status', 'membership'],
  },
  {
    id: 'emergency-contact', label: 'Emergency contact', defaultItems: 'name, surname, phone number', special: false,
    keywords: ['emergency contact', 'emergency number', 'in case of emergency', 'ice contact'],
  },
  {
    id: 'professional-educational', label: 'Professional and Educational Details',
    defaultItems: 'e.g. CV, level of studies completed, studies currently pursued; current and past occupation; education and knowledge background', special: false,
    keywords: ['cv', 'resume', 'studies', 'university', 'occupation', 'education', 'degree', 'student number', 'faculty'],
  },
  {
    id: 'application-process', label: 'Application process', defaultItems: 'e.g. motivation letter', special: false,
    keywords: ['motivation letter', 'application form', 'cover letter', 'apply', 'application'],
  },
  {
    id: 'meal-details', label: 'Meal details', defaultItems: 'e.g. selection of meals', special: false,
    keywords: ['meal', 'lunch', 'dinner', 'breakfast', 'menu', 'food choice', 'catering'],
  },
  {
    id: 'health-data', label: 'Health data', defaultItems: 'dietary restrictions, allergies and other special requirements', special: true,
    keywords: ['dietary', 'allerg', 'vegetarian', 'vegan', 'gluten', 'lactose', 'halal', 'kosher', 'health', 'medical', 'medication', 'disability', 'wheelchair', 'special requirement', 'intoleran'],
  },
  {
    id: 'transfer-details', label: 'Transfer details', defaultItems: 'e.g. time of pick-up, place of pick-up, flight number, departure and arrival', special: false,
    keywords: ['pick-up', 'pickup', 'flight', 'arrival', 'departure', 'train', 'transport', 'transfer detail', 'airport'],
  },
  {
    id: 'accommodation-details', label: 'Accommodation details', defaultItems: 'period of stay, room, room preferences', special: false,
    keywords: ['accommodation', 'hotel', 'hostel', 'room', 'stay', 'roommate', 'housing'],
  },
  {
    id: 'additional-services', label: 'Choice of additional services', defaultItems: 'Services and products purchased, prices', special: false,
    keywords: ['additional service', 'merch', 'merchandise', 'gala', 'extra ticket', 'add-on'],
  },
  {
    id: 'event-activity', label: 'Event Activity',
    defaultItems: 'e.g. workshops to attend, participation in the event, presences, special role taken during the event', special: false,
    keywords: ['workshop', 'plenary', 'session', 'attendance', 'presence', 'panel', 'moot', 'pleading', 'team number', 'score'],
  },
  {
    id: 'photos-recordings', label: 'Photographs and recordings',
    defaultItems: 'photographs and video recordings taken during the event', special: false,
    keywords: ['photo', 'picture', 'video', 'recording', 'social media post', 'livestream'],
  },
];

/** HB Ch. 3.4.2 — specific data sources. */
export const SOURCE_OPTIONS: { id: string; label: string; keywords: string[] }[] = [
  { id: 'website-form', label: 'Website Form', keywords: ['website form', 'our website'] },
  { id: 'jotform', label: 'JotForm', keywords: ['jotform'] },
  { id: 'google-form', label: 'Google Form', keywords: ['google form', 'gform'] },
  { id: 'email', label: 'E-mail', keywords: ['by email', 'via email', 'by e-mail', 'via e-mail', 'send an email'] },
  { id: 'document', label: 'Word/Excel/PDF document that is filled out and sent', keywords: ['excel', 'spreadsheet', 'word document', 'pdf form'] },
  { id: 'social-media', label: 'Social media', keywords: ['instagram', 'facebook', 'linkedin', 'social media'] },
  { id: 'paper-form', label: 'Paper form', keywords: ['paper form', 'on paper', 'sign-up sheet'] },
];

/** HB Ch. 3.4.4 — transfers within ELSA. */
export const INTERNAL_RECIPIENT_OPTIONS: { id: string; label: string; keywords: string[] }[] = [
  { id: 'own-board', label: 'Our own National/Local Board', keywords: ['national board', 'local board', 'the board'] },
  { id: 'own-team', label: 'Our own National/Local Team', keywords: ['national team', 'local team'] },
  { id: 'own-council', label: 'Our own National/Local Council', keywords: ['council'] },
  { id: 'local-groups', label: 'Our Local Groups', keywords: ['local groups'] },
  { id: 'elsa-international', label: 'ELSA International', keywords: ['elsa international'] },
  { id: 'other-groups', label: 'Other National/Local Groups', keywords: ['other national group', 'other local group'] },
  { id: 'organising-committees', label: 'Organising Committees', keywords: ['organising committee', 'organizing committee', ' oc '] },
];

/** HB Ch. 3.4.4 — third parties outside ELSA. */
export const EXTERNAL_RECIPIENT_OPTIONS: { id: string; label: string; keywords: string[] }[] = [
  { id: 'cloud-providers', label: 'Cloud Software Providers (Google, Microsoft, cloud service providers, mailing providers)', keywords: ['google drive', 'google workspace', 'microsoft', 'onedrive', 'dropbox', 'mailchimp', 'cloud'] },
  { id: 'meeting-platforms', label: 'Online Meeting Platforms (Google Meet, ClickMeeting, Zoom…)', keywords: ['zoom', 'google meet', 'clickmeeting', 'teams meeting', 'webex'] },
  { id: 'it-providers', label: 'IT Software Providers', keywords: ['software provider', 'it provider', 'platform provider'] },
  { id: 'public-agencies', label: 'Public agencies and institutions (e.g. tax authorities)', keywords: ['tax authorit', 'public agency', 'municipality', 'ministry'] },
  { id: 'partner-organisations', label: 'Partner organisations engaged in the performance of our tasks', keywords: ['partner organisation', 'partner organization', 'law firm', 'sponsor'] },
  { id: 'auditors-payroll', label: 'Auditors and payroll tax auditors', keywords: ['auditor'] },
  { id: 'accommodations', label: 'Accommodations', keywords: ['hotel', 'hostel', 'accommodation provider'] },
  { id: 'restaurants', label: 'Restaurants, bars, clubs', keywords: ['restaurant', 'bar', 'club', 'catering'] },
  { id: 'international-orgs', label: 'International Organisations (UN, Council of Europe, etc.)', keywords: ['council of europe', 'united nations', ' un ', 'world trade organisation', 'international organisation'] },
  { id: 'partners', label: 'Partners', keywords: ['partners'] },
  { id: 'speakers', label: 'Speakers', keywords: ['speaker'] },
  { id: 'event-organisers', label: 'Event Organisers (museum, institutions, etc.)', keywords: ['museum', 'venue', 'event organiser', 'event organizer'] },
];

/** HB Ch. 3.4.3 — the six legal bases. `annex4LeadIn` = Annex 4 §3 ships fixed wording for it. */
export const LEGAL_BASIS_DEFS: { id: LegalBasis; label: string; annex4LeadIn: boolean }[] = [
  { id: 'contract', label: 'Contractual Obligations', annex4LeadIn: true },
  { id: 'consent', label: 'Consent', annex4LeadIn: true },
  { id: 'legitimateInterest', label: 'Legitimate Interests', annex4LeadIn: true },
  { id: 'legalObligation', label: 'Legal Compliance (legal obligation)', annex4LeadIn: true },
  { id: 'publicInterest', label: 'Public Interest', annex4LeadIn: false },
  { id: 'vitalInterests', label: 'Vital Interests', annex4LeadIn: false },
];

/** A4 Summary "Purposes of the Processing" — template example purposes with sensible default bases. */
export const PURPOSE_SUGGESTIONS: { text: string; basis: LegalBasis; keywords: string[] }[] = [
  { text: 'Identify you', basis: 'contract', keywords: ['identify', 'registration', 'register'] },
  { text: 'To contact you', basis: 'contract', keywords: ['contact you', 'send you', 'inform you', 'newsletter'] },
  { text: 'Register your participation in the event', basis: 'contract', keywords: ['register', 'sign up', 'signup', 'application'] },
  { text: 'Organise the academic and social programme', basis: 'contract', keywords: ['programme', 'program', 'workshop', 'agenda', 'schedule'] },
  { text: 'To provide meals adapted to dietary restrictions and allergies', basis: 'consent', keywords: ['dietary', 'allerg', 'meal', 'food'] },
  { text: 'To provide accommodation', basis: 'contract', keywords: ['accommodation', 'hotel', 'hostel', 'room'] },
  { text: 'To organise transport and pick-ups', basis: 'contract', keywords: ['transport', 'pick-up', 'pickup', 'flight', 'shuttle'] },
  { text: 'Publish your photos on our website and social media pages', basis: 'consent', keywords: ['photo', 'picture', 'social media', 'video'] },
  { text: 'To transfer your personal data to international organisations with whom we collaborate', basis: 'consent', keywords: ['council of europe', 'international organisation'] },
  { text: 'Identify qualifications and previous experiences', basis: 'contract', keywords: ['qualification', 'experience', 'cv', 'motivation letter'] },
  { text: 'Manage our human resources', basis: 'legitimateInterest', keywords: ['human resources', 'recruit', 'volunteer management'] },
  { text: 'Answer inquiries and provide support', basis: 'legitimateInterest', keywords: ['inquir', 'support', 'question'] },
  { text: 'To maintain and improve our events', basis: 'legitimateInterest', keywords: ['improve', 'feedback', 'evaluation'] },
  { text: 'Notify you about changes to our Privacy Policy', basis: 'legalObligation', keywords: [] },
  { text: 'Comply with applicable legislation', basis: 'legalObligation', keywords: ['legislation', 'legal requirement', 'law'] },
  { text: 'The legal enforcement of claims and rights', basis: 'legalObligation', keywords: ['claims'] },
];

/** HB Ch. 4.3.2 — consent-banner checklist (shown with the Art. 9 safeguard and in follow-up advice). */
export const CONSENT_BANNER_CHECKLIST: string[] = [
  'Freely given: consent must be given voluntarily, without coercion or pressure',
  'Specific: consent should be obtained for specific purposes, not a blank agreement',
  'Informed: users need clear information about what they are consenting to (all types of data collected, how it will be used, who it will be shared with)',
  'Unambiguous: consent must be indicated by a clear, affirmative action',
  'Equal prominence: "accept" and "reject" buttons displayed with equal prominence and accessibility',
  'No pre-ticked boxes',
  'Easily withdrawn: it should be as easy to withdraw consent as it is to give it; inform users how',
  'Use clear and simple language',
];

/** EEA member states (EU + IS, LI, NO) — used to detect outside-EEA transfers deterministically. */
export const EEA_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Czech Republic', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
  'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  'Iceland', 'Liechtenstein', 'Norway',
];

/** Common non-EEA countries the analyser recognises in pasted text. */
export const COMMON_THIRD_COUNTRIES = [
  'United States', 'USA', 'United Kingdom', 'UK', 'Switzerland', 'Turkey', 'Türkiye', 'Serbia', 'Albania',
  'North Macedonia', 'Montenegro', 'Bosnia and Herzegovina', 'Ukraine', 'Georgia', 'Armenia', 'Azerbaijan', 'Moldova',
];

/** Art. 9 signal words beyond the health-data category (HB Ch. 1.6.2). */
export const ART9_SIGNALS: { label: string; keywords: string[] }[] = [
  { label: 'health data (incl. dietary restrictions and allergies)', keywords: ['dietary', 'allerg', 'health', 'medical', 'medication', 'disability', 'wheelchair', 'vegan', 'vegetarian', 'gluten', 'lactose', 'intoleran'] },
  { label: 'religious or philosophical beliefs', keywords: ['religio', 'halal', 'kosher', 'philosophical belief', 'prayer'] },
  { label: 'racial or ethnic origin', keywords: ['ethnic', 'racial'] },
  { label: 'political opinions', keywords: ['political opinion', 'political affiliation'] },
  { label: 'trade-union membership', keywords: ['trade union'] },
  { label: 'genetic or biometric data', keywords: ['biometric', 'genetic', 'fingerprint', 'facial recognition'] },
  { label: 'sex life or sexual orientation', keywords: ['sexual orientation', 'gender identity'] },
];
