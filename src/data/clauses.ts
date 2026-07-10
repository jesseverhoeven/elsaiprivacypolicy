/**
 * THE CLAUSE LIBRARY — single source of truth for all policy wording.
 *
 * Fixed text is copied VERBATIM from "Annex 4 — Template Privacy Policy" (.docx),
 * including its original spelling (e.g. "innacuracies", "anonymize"). Do NOT edit at
 * runtime; changes happen via git commit + redeploy so every change is reviewable
 * (brief §2.5). Placement rules follow Handbook Ch. 4.2. `{{tokens}}` mark the only
 * variable spots (yellow-highlighted in the .docx).
 *
 * `deviation` marks the few clauses that are NOT verbatim Annex 4 and why:
 *   - 'audience-adaptation'      : participant-audience variants (user decision A, 2026-07-10);
 *                                  the verbatim volunteer original sits alongside each one.
 *   - 'joint-controller-adaptation': Annex 4 has no joint-controller wording; Ch. 4.2 requires
 *                                  naming joint controllers, so minimal wording was added.
 *   - 'contact-adaptation'       : §7 fixed contact secgen@elsa.org — controller e-mail shown
 *                                  first, secgen@ kept (user decision C).
 *   - 'brief-item-2' / 'brief-item-12': optional DPO line / no-automated-decisions statement,
 *                                  prompted by the brief's GDPR Art. 12–14 checklist.
 * Every deviation must be reviewed by dataprotection@elsa.org.
 */

export const TEMPLATE_VERSION = '1.0.0 (Annex 4, Handbook 25/26)';

export const SRC = {
  A4_SUMMARY: 'Annex 4 — Summary Section',
  A4_S1: 'Annex 4 §1 About us',
  A4_S2: 'Annex 4 §2 Personal Data Collection',
  A4_S3: 'Annex 4 §3 Legal Basis and Purposes',
  A4_S4: 'Annex 4 §4 Data Retention',
  A4_S5: 'Annex 4 §5 Data Transfers & Sharing',
  A4_S6: 'Annex 4 §6 Data Security',
  A4_S7: 'Annex 4 §7 Your Rights',
  A4_S8: 'Annex 4 §8 Changes to this Privacy Policy',
  A4_S9: 'Annex 4 §9 Contact Us',
  HB_42: 'Handbook Ch. 4.2',
  HB_162: 'Handbook Ch. 1.6.2',
  HB_432: 'Handbook Ch. 4.3.2',
  BRIEF_12: 'Brief §12 (GDPR Art. 12–14 checklist)',
} as const;

/* ------------------------------------------------------------------ */
/* Review / legal-limitation notice (brief §2.7, mirrors the Handbook's
   own disclaimer in Ch. 4.2 and its General Disclaimer)               */
/* ------------------------------------------------------------------ */

export const REVIEW_NOTICE =
  'This document is a generated draft and serves as an aid only. It is not legal advice and it by no means claims ' +
  'to be complete or legally valid. In particular, national laws must be observed when applying it. It must be ' +
  'reviewed by a qualified person before use. For questions, contact the ELSA International Data Protection team ' +
  'at dataprotection@elsa.org.';

/**
 * Legal disclaimer for the web application itself (shown in the app UI).
 * Protects the Tool's creator and ELSA from liability for the use of the output.
 */
export const LEGAL_DISCLAIMER =
  'This web application ("the Tool") is provided free of charge, "as is" and "as available", without warranty of any ' +
  'kind, express or implied, including but not limited to warranties of accuracy, completeness, merchantability, ' +
  'fitness for a particular purpose or non-infringement. The Tool generates draft documents by mechanically combining ' +
  'user input with pre-approved template text; its output does not constitute legal advice, and no lawyer–client or ' +
  'other advisory relationship is created by its use. To the fullest extent permitted by applicable law, neither ' +
  'Jesse Verhoeven, the author and developer of the Tool, nor the European Law Students’ Association (ELSA), ELSA International, any ELSA ' +
  'National or Local Group, nor any of their respective officers, members, employees or volunteers accepts any ' +
  'liability or responsibility for any loss or damage of any kind — whether direct, indirect, incidental or ' +
  'consequential — arising from or in connection with the use of the Tool, reliance on its output, or the publication ' +
  'or use of any document generated with it, including where the output is incorrect, incomplete or unlawful. Sole ' +
  'responsibility for verifying, adapting and lawfully using any generated document rests with the user and the ' +
  'entity publishing it. Always perform your own check, have the output reviewed by a qualified person before use, ' +
  'and, where appropriate, consult your ELSA National Data Protection representative, the ELSA International Data ' +
  'Protection team (dataprotection@elsa.org) or the competent national data protection authority. National laws and ' +
  'regulations must always be observed.';

/* ------------------------------------------------------------------ */
/* Summary Section                                                     */
/* ------------------------------------------------------------------ */

export const SUMMARY = {
  whoWeAreHeading: 'Who we are',
  /** Verbatim; joint variant is a marked adaptation (Ch. 4.2 requires joint-controllers' details). */
  whoWeAreController:
    'The data controller for the processing activities within this Policy is the European Law Students’ Association (ELSA) {{groupName}}:',
  whoWeAreJoint:
    'The data controllers for the processing activities within this Policy are the European Law Students’ Association (ELSA) {{groupName}} and {{jointName}}, acting as joint controllers:',
  personalDataHeading: 'Personal data we process',
  purposesHeading: 'Purposes of the Processing',
  rightsHeading: 'Your rights',
  /** FIXED — Ch. 4.2: "Nothing. Leave section as it is in the template." Original spelling kept. */
  rightsIntro: 'You possess the following data protection rights, that you can exercise by reaching out to us:',
  rightsBullets: [
    'Right to Access: you can request a copy of your personal data;',
    'Right to Correction: you can request us to rectify innacuracies or incompleteness in your personal data;',
    'Right to withdraw consent: you have the right to withdraw your consent at any time, affecting future processing;',
    'Right to erasure: you have the right to request the deletion of your personal data if it is no longer needed for the purposes it was collected or processed unlawfully;',
    'Right to restrict processing: you have the right to request the limitation of our processing activities, under certain circumstances;',
    'Right to data portability: you can request that we transmit your personal data to another data controller;',
    'Right to object to processing: under certain circumstances, you can object to our processing activities based on your specific situation;',
    'Right to file a complaint with a supervisory authority: you always have the right to lodge a complaint with a data protection authority if you believe that our data processing activities are unlawful.',
  ],
  moreDetailsHeading: 'More details',
};

/* ------------------------------------------------------------------ */
/* Detailed Section                                                    */
/* ------------------------------------------------------------------ */

export const S1_ABOUT_US = {
  heading: '1 - About us',
  /** Verbatim Annex 4 (volunteer audience). */
  welcomeVolunteers:
    'Welcome to our privacy policy ("privacy policy"), which outlines how we handle and safeguard your personal data when volunteering with ELSA {{groupName}}.',
  /** deviation: audience-adaptation (user decision A). */
  welcomeParticipants:
    'Welcome to our privacy policy ("privacy policy"), which outlines how we handle and safeguard your personal data when participating in {{activityTitle}} organised by ELSA {{groupName}}.',
  /** Verbatim. */
  managedByController:
    'The data processing is managed by the European Law Students’ Association (ELSA) {{groupName}}, located at {{address}} (referred to as "the Association", "we", "our", or "us"). The Association is responsible for the data processing activities detailed in this policy and acts as the data controller.',
  /** deviation: joint-controller-adaptation (Ch. 4.2 "About us": implement joint-controllers' details). */
  managedByJoint:
    'The data processing is jointly managed by the European Law Students’ Association (ELSA) {{groupName}}, located at {{address}}, and {{jointName}}, located at {{jointAddress}} (together referred to as "the Association", "we", "our", or "us"). They are jointly responsible for the data processing activities detailed in this policy and act as joint controllers. You can exercise your data protection rights in respect of and against each of the controllers.',
  /** deviation: joint-controller-adaptation (Ch. 4.2 "About us (if applicable)": purposes for which you act as sole controller). */
  soleControllerPurposes:
    'ELSA {{groupName}} acts as the sole data controller for the following purposes: {{purposes}}.',
  /** Verbatim. */
  gdprDefinitions:
    'Unless otherwise specified in this privacy policy, the terms used here have the same definitions outlined in the European Union’s General Data Protection Regulation ("GDPR").',
  appliesToIntro: 'This Policy applies to:',
  appliesToItem: 'The processing of personal data of {{dataSubjects}};',
  /** deviation: brief-item-2 — optional DPO/data-protection contact (GDPR Art. 13(1)(b)); off unless provided. */
  dpoLine: 'You can reach our data protection contact at: {{dpoContact}}.',
};

export const S2_COLLECTION = {
  heading: '2 - Personal Data Collection',
  catHeading: 'Categories of Personal Data Collected',
  /** Verbatim Annex 4 (volunteer audience). */
  catIntroVolunteers:
    'We gather and receive personal information for various purposes associated with recruitment and management of the volunteers who work with us. Specifically, we process the following categories of personal data:',
  /** deviation: audience-adaptation. */
  catIntroParticipants:
    'We gather and receive personal information for various purposes associated with the organisation of {{activityTitle}} and the management of its participants. Specifically, we process the following categories of personal data:',
  /** Verbatim Annex 4 (volunteer audience) — also covers GDPR Art. 13(2)(e) consequences of not providing. */
  noObligationVolunteers:
    'You are under no obligation to provide your personal data. Nonetheless, it’s important to be aware that we cannot recruit you or work with you without the essential personal data required to fulfil the contractual obligations between you and us.',
  /** deviation: audience-adaptation. */
  noObligationParticipants:
    'You are under no obligation to provide your personal data. Nonetheless, it’s important to be aware that we cannot register you for or provide you with {{activityTitle}} without the essential personal data required to fulfil the contractual obligations between you and us.',
  howHeading: 'How we collect personal data',
  /** Verbatim Annex 4 (volunteer audience). */
  howIntroVolunteers:
    'We collect personal data about you in different ways, starting from the recruitment phase to your subsequent inclusion in our team.',
  /** deviation: audience-adaptation. */
  howIntroParticipants:
    'We collect personal data about you in different ways, starting from your registration to your participation in {{activityTitle}}.',
  /** Verbatim. */
  howIntro2: 'In particular, we collect personal data either directly or indirectly from you.',
  directHeading: 'Direct Collection',
  indirectHeading: 'Indirect Collection',
};

export const S3_LEGAL_BASIS = {
  heading: '3 - Legal Basis and Purposes',
  /** Verbatim. */
  intro:
    'Our justification for collecting and using the personal data as outlined in this Privacy Policy is contingent on the type of personal data collected and the specific objectives for which it is gathered.',
  /** Verbatim Annex 4 lead-ins per legal basis. */
  contractVolunteers:
    'Contractual Obligations: We collect and process personal data about you as a volunteer to recruit you and manage your respective tasks. In particular, we rely on contractual obligations, to:',
  /** deviation: audience-adaptation. */
  contractParticipants:
    'Contractual Obligations: We collect and process personal data about you as a participant to register you and manage your participation. In particular, we rely on contractual obligations, to:',
  consent:
    'Consent: We may rely on your voluntary consent, which you provided to us when sharing your personal data. In particular, we rely on your consent, to the extent agreed in the declaration of consent, to:',
  legitimateInterest:
    'Legitimate Interests: We utilize legitimate interests as the legal basis for processing, based on our evaluation that the processing is equitable and justifiable and does not infringe upon your interests or fundamental rights and freedoms. Our legitimate interests are related to ensuring proper working processes, ensuring better performance and the overall optimization of our internal process. Our legitimate interests are, in particular to:',
  legalObligation:
    'Legal Compliance: We process personal data when necessary to comply with legal obligations and regulations. In particular, we rely on legal compliance, to:',
  /** deviation: brief-item-12 — optional statement, GDPR Art. 13(2)(f); Handbook notes ADM generally does not apply to ELSA. */
  noAutomatedDecisions:
    'No automated decision-making, including profiling, within the meaning of Article 22 GDPR takes place in the context of the processing activities described in this Privacy Policy.',
  /** deviation: lecercle-enhancement — shown when consent is a basis (approved LeCercle wording). */
  consentWithdrawal:
    'You may withdraw your consent at any time by contacting {{controllerEmail}}. The withdrawal of consent does not affect the lawfulness of processing carried out before the withdrawal.',
  /** deviation: lecercle-enhancement — shown when legitimate interest is a basis (approved LeCercle wording). */
  legitimateInterestObjection:
    'You may object to processing carried out on the basis of our legitimate interests at any time, on grounds relating to your particular situation, by contacting {{controllerEmail}}.',
};

export const S4_RETENTION = {
  heading: '4 - Data Retention',
  /** FIXED — Ch. 4.2: leave as it is in the template. */
  body:
    'We keep personal data for the duration necessary to fulfil the purposes for which it was obtained, per legal and regulatory obligations, as well as contractual agreements. Once this retention period concludes, we either delete or irreversibly anonymize your personal data.',
};

export const S5_TRANSFERS = {
  heading: '5 - Data Transfers & Sharing',
  recipientsHeading: 'Data Recipients',
  /** Verbatim. */
  recipientsIntro:
    'We collaborate with third-party service providers to support the functioning of our services, as well as with administrative, regulatory and public authorities when there is a legal or administrative obligation we are bound to regarding the sharing of your personal data ("data recipients"). Our service providers assist in various activities, such as facilitating payments and providing IT infrastructure. They are granted access to your personal data solely to the extent required to carry out these tasks.',
  recipientsListIntro: 'Types of data recipients who may access your personal data:',
  thirdCountryHeading: 'Third-Country and International Organisation Transfers',
  /**
   * deviation: lecercle-enhancement — wording follows the approved amended LeCercle Supporters
   * policy (03.05.2026): "data recipients" instead of "service providers", the doubled
   * "adhere to" fixed, and the EU–US Data Privacy Framework added to the adequacy bullet.
   * Conditional section: only when data leaves the EEA / goes to international organisations.
   */
  tcIntro:
    'It’s worth noting that we engage data recipients located in third countries, which are regions outside the EU. These third countries may not offer a level of data protection equivalent to that of the EU.',
  tcSafeguards:
    'To ensure the security of your personal data during international transfers, we adhere to our contractual obligations and the applicable data protection regulations. These safeguards encompass:',
  tcSafeguardBullets: [
    'Transferring data to countries that have received an adequacy decision by the European Commission, including, where applicable, transfers to entities certified under the EU–US Data Privacy Framework.',
    'Implementing standard contractual clauses provided by the European Commission, per Commission Implementing Decision (EU) 2021/914 of 4 June 2021, as well as supplementary measures for the transfer, where we deem those measures as necessary to ensure an essentially equivalent level of protection to that of the EU.',
  ],
  tcCountriesIntro:
    'We and/or our service providers transfer your personal data and process it in various third countries. These countries include:',
  tcOrgsIntro:
    'We furthermore may transfer your personal data to international organisations in the course of our activities that involve you. These organisations are:',
  tcSccCopy:
    'In cases where the transfer to a third country or international organisation is based on the usage of standard contractual clauses provided by the European Commission, you have the right to ask for a copy of the clauses under which your personal data is transferred to a third country. Bear in mind that the contract will be redacted in what concerns business secrets or other confidential information (e.g. personal data of other individuals). You may ask for the applicable copies by reaching out to: {{sccContactEmail}}',
  tcConsentFallback:
    'In all other cases, we shall request your consent before transferring the personal data to the relevant third countries or international organisations. In the event of a transfer to a third country where adequacy decisions or appropriate safeguards are absent, it is conceivable that authorities in the third country, such as intelligence services, could access the transferred data. Consequently, the enforceability of your data subject rights may not be guaranteed.',
  disclosureHeading: 'Data Disclosure',
  /** FIXED. */
  disclosureIntro:
    'We may disclose your personal data when we have a sincere belief that such disclosure is essential for the following purposes:',
  disclosureBullets: [
    'To adhere to a legal obligation, which includes cases where such disclosure is mandated by law or in response to valid requests from public authorities, such as a court or government agency.',
    'To safeguard the security of our services and safeguard our rights or property.',
    'To avert or investigate potential misconduct linked to our operations.',
  ],
};

export const S6_SECURITY = {
  heading: '6 - Data Security',
  /** FIXED — Ch. 4.2: leave as it is in the template. */
  paragraphs: [
    'We implement reasonable technical and organisational security measures that we consider appropriate to safeguard your stored personal data from manipulation, loss, or unauthorized access by third parties. Our security measures are continuously updated to align with advancements in technology.',
    'We place significant emphasis on internal data privacy. Our staff and engaged service providers are bound by confidentiality and must comply with relevant data protection laws. Moreover, they are granted access to personal data only to the extent necessary for the performance of their respective duties or obligations.',
    'We value the security of your personal data; however, please bear in mind that no method of transmitting data over the internet or electronic storage can be guaranteed 100% secure. While we make every effort to employ commercially reasonable measures to protect your personal data, we cannot provide absolute security. We recommend employing antivirus software, firewalls, and similar tools to enhance the protection of your system.',
  ],
};

export const S7_RIGHTS = {
  heading: '7 - Your Rights',
  /**
   * Annex 4 fixed intro embeds secgen@elsa.org (hyperlink in the .docx).
   * deviation: contact-adaptation — controller e-mail first, secgen@ kept (user decision C).
   */
  intro:
    'You possess the following data protection rights. To exercise these rights, please reach out to us at the provided address or send an email to {{controllerEmail}} or to secgen@elsa.org. Please be aware that we may ask you to verify your identity before addressing your requests.',
  /** FIXED — Ch. 4.2: leave as it is in the template. EDPB link recovered from the .docx hyperlink. */
  bullets: [
    'Right to Access: You have the right to request a copy of your personal data, which we will furnish to you in an electronic format.',
    'Right to Correction: You can request us to rectify any inaccuracies or incompleteness in your data.',
    'Right to Withdraw Consent: If you’ve given your consent for the processing of your personal data, you have the right to withdraw it at any time, affecting future processing, but not the lawfulness of the data processing activities before it. Once we receive your withdrawal of consent, we will no longer process your information for the purpose(s) you initially consented to, unless there exists another legal basis for processing.',
    'Right to Erasure: You have the right to request the deletion of your personal data when it is no longer necessary for the purposes it was collected, or if it was processed unlawfully.',
    'Right to Restrict Processing: You can request the limitation of our processing of your personal data in cases where you believe it to be inaccurate, processed unlawfully, or no longer needed for the original purpose, but cannot be deleted due to legal obligations or your own request.',
    'Right to Data Portability: You can request that we transmit your personal data to another data controller in a standard format (e.g., Excel), if you provided this data to us and we processed it based on your consent or to fulfil contractual obligations.',
    'Right to Object to Processing: If the legal basis for processing your personal data is our legitimate interest, you have the right to object to such processing based on your specific situation. We will respect your request, unless we have a compelling legal basis for the processing that outweighs your interests or if we need to continue processing the data for legal defense purposes.',
    'Right to File a Complaint with a Supervisory Authority: If you believe that the processing of your personal data violates data protection laws, you have the right to lodge a complaint with a data protection supervisory authority. In the EU and EEA, you can exercise this right by contacting a supervisory authority in your country of residence, workplace, or where you believe the infringement occurred. You can find a list of relevant authorities here: https://edpb.europa.eu/about-edpb/about-edpb/members_en.',
  ],
  /** FIXED. */
  responseTime:
    'We will provide you with an answer to your requests within 30 days of receipt. This response timeframe may be extended if the request is particularly complex, of which we will inform you promptly. Within that timeframe, we will either comply with your request or provide you with the reasons why your request cannot be complied with.',
};

export const S8_CHANGES = {
  heading: '8 - Changes to this Privacy Policy',
  /** FIXED apart from {{noticeDays}} (Ch. 4.2: check the days are applicable and reasonable; default 7). */
  paragraphs: [
    'Our Privacy Policy may be updated periodically. We encourage you to check this Privacy Policy from time to time for any modifications.',
    'We furthermore put in our best efforts to inform you of any changes to this Privacy Policy, by adopting appropriate means to grab your attention to these changes. To that end, we will inform you by e-mail of any changes to this Policy that apply to you.',
    'We ensure that we inform you before proceeding to these changes, by notifying you through the previous means at least {{noticeDays}} days before making the changes come into force.',
    'Changes to this Privacy Policy become effective once they are published on this page.',
  ],
};

export const S9_CONTACT = {
  heading: '9 - Contact Us',
  intro: 'If you have any inquiries or concerns regarding this Privacy Policy, please do not hesitate to contact us at:',
};

/** Simple token substitution — deterministic, no logic in templates. */
export function fill(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => tokens[key] ?? `[${key} missing]`);
}
