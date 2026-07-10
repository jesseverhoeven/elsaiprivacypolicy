/**
 * PRESET EVENTS — previously approved ELSA privacy policies, converted into
 * prefill data. Choosing one in step 1 pre-fills all VARIABLE information
 * (controller, categories, purposes, recipients, transfers…); the fixed Annex 4
 * wording is never taken from here. Preset-derived values are marked in the
 * questionnaire (orange) so officers see what came from the past policy.
 *
 * To add a new approved policy: add an entry here via git commit + redeploy —
 * no database needed; the repo is the (versioned, reviewable) store.
 */

import type { Answers } from '../types';

export interface PresetEvent {
  id: string;
  name: string;
  description: string;
  sourcePolicy: string; // which approved policy this comes from
  /** Points the officer must re-check because they typically change between editions. */
  attentionPoints: string[];
  /** Partial prefill applied over the defaults. */
  prefill: Partial<Answers>;
  /** Data categories to enable, with their exact items from the approved policy. */
  categories: { id: string; items: string }[];
  /** Custom categories that don't map to a standard pick-list entry. */
  customCategories: { label: string; items: string }[];
  purposes: { text: string; basis: Answers['purposes'][number]['basis'] }[];
}

export const PRESET_EVENTS: PresetEvent[] = [
  {
    id: 'lecercle',
    name: 'LeCercle Supporters',
    description: 'ELSA International’s alumni & supporters contribution programme (registration, contributions, WhatsApp community).',
    sourcePolicy: 'Amended Privacy Policy — LeCercle Supporters (last updated 03.05.2026, approved)',
    attentionPoints: [
      'Controller: the approved policy names ELSA International as sole controller — is that still correct?',
      'Payment service provider and contribution models may have changed — check the recipients and billing items.',
      'WhatsApp opt-in (consent) — confirm the chat/community still exists and the opt-in box is on the form.',
      'Third-country transfers listed the United States of America — verify the current providers.',
    ],
    prefill: {
      activityTitle: 'LeCercle Supporters',
      audience: 'participants',
      controllerKind: 'controller',
      controller: {
        name: 'International',
        address: '239 Boulevard Général Jacques, 1050 Ixelles, Brussels, Belgium',
        email: 'secgen@elsa.org',
        phone: '+32 2 646 2626',
      },
      extraEmails: ['president@elsa.org'],
      controllerCountry: 'BE',
      dataSubjects: ['Alumni', 'Partners'],
      dataSubjectsOther: 'LeCercle Supporters',
      directSources: [
        'Website Form',
        'Payment service provider integrated into the registration form',
      ],
      indirectSources: ['When you are contacting us'],
      recipientsInternal: ['ELSA International'],
      recipientsExternal: [
        'Cloud Server Providers (e.g. Google Workspace/Gmail, Microsoft)',
        'Online form and registration platforms (e.g. JotForm, Google Forms)',
        'Payment service providers (for processing payments)',
        'IT Software Providers',
        'Messaging platforms (e.g. WhatsApp / Meta Platforms Ireland Ltd)',
        'Partner organisations engaged in the performance of our tasks',
        'Auditors and payroll tax auditors',
      ],
      transfersOutsideEEA: true,
      thirdCountries: ['The United States of America'],
      internationalOrgs: [],
      sccContactEmail: 'secgen@elsa.org',
      noticeDays: 14,
    },
    categories: [
      { id: 'personal-identification', items: 'name, surname' },
      { id: 'contact-information', items: 'e-mail address' },
      { id: 'elsa-activity', items: 'involvement in local, national, international and other structures of ELSA, years of activity in ELSA' },
      { id: 'billing-contribution', items: 'selected contribution model, contribution amount, contribution frequency, subscription status, payment authorisation/mandate details and payment-related information necessary to process and manage your support' },
      { id: 'communication-data', items: 'messages, inquiries, requests or other information you provide when contacting us in relation to your support of ELSA' },
    ],
    customCategories: [
      { label: 'Project interests', items: 'the specific ELSA projects or activities you indicate an interest in via the registration form' },
      { label: 'WhatsApp opt-in', items: 'your request, where given, to receive an invitation link to the WhatsApp chat with ELSA International’s Alumni' },
    ],
    purposes: [
      { text: 'Register and manage your participation in the event', basis: 'contract' },
      { text: 'To process and manage payments, including related administrative matters', basis: 'contract' },
      { text: 'To communicate with you regarding your participation, requests or inquiries', basis: 'contract' },
      { text: 'To send you an invitation link to a group chat, where you have requested this', basis: 'consent' },
      { text: 'To keep records of participants and their registrations', basis: 'legitimateInterest' },
      { text: 'To share relevant information about ELSA, its projects, activities or opportunities', basis: 'legitimateInterest' },
      { text: 'To keep our forms, platforms and systems secure and functioning properly', basis: 'legitimateInterest' },
      { text: 'Notify you about changes to our Privacy Policy', basis: 'legalObligation' },
      { text: 'Comply with applicable legal, tax, accounting or regulatory obligations', basis: 'legalObligation' },
      { text: 'To establish, exercise or defend legal claims and protect the rights and interests of ELSA', basis: 'legalObligation' },
    ],
  },
];

export function presetById(id: string | null): PresetEvent | undefined {
  return PRESET_EVENTS.find((p) => p.id === id);
}
