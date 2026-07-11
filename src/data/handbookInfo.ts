/**
 * In-depth explanations shown via the 📖 book icon next to each questionnaire
 * heading and the 💡 lightbulb per data category. Condensed from the ELSA Data
 * Protection Handbook 25/26 (chapters cited per entry) — guidance only, the
 * legal logic stays in the clause library and Handbook mapping.
 */

export interface SectionInfo {
  chapter: string;
  paragraphs: string[];
}

export const SECTION_INFO: Record<string, SectionInfo> = {
  controller: {
    chapter: 'Handbook Ch. 3.4.1 & Ch. 1 “Controller”',
    paragraphs: [
      'The controller is the entity that decides WHY and HOW personal data is processed — for an ELSA event this is normally the ELSA group organising it, not the individual officer. Identify the specific project or activity first (e.g. “organisation of an NCM”) and then who controls the data processing for it.',
      'Joint controllership arises when two entities decide together — the Handbook’s own example is an NCM: the hosting Local Group and the National Group organising it are joint controllers. In that case both must be named in the policy, and data subjects can exercise their rights against either of them (Art. 26 GDPR). An Organising Committee that genuinely co-decides is a joint controller too.',
      'A processor, by contrast, only processes data ON THE CONTROLLER’S INSTRUCTIONS (e.g. a registration platform or payment provider) — it never decides the purposes. Processors are listed among the data recipients, and a data processing agreement should be in place with each.',
    ],
  },
  subjects: {
    chapter: 'Handbook Ch. 3.4.2',
    paragraphs: [
      'Data subjects are the people whose personal data the activity touches. The Handbook’s list includes: National/Local Group Representatives, Team Officers, International Guests, Chairs, Auditors, Board representatives (incl. former Boards for relief of responsibility), Alumni, Partners, Speakers, Emergency Contacts of participants, Participants (and coaches of teams), and Panelists.',
      'One processing activity often has several data-subject categories at once — think beyond the participants: do you also process speakers’ bios, coaches’ contact details, or the phone number of someone’s emergency contact (that contact is a data subject too, and you received their data indirectly)?',
    ],
  },
  categories: {
    chapter: 'Handbook Ch. 3.4.2 & Ch. 1.6.2',
    paragraphs: [
      'List every TYPE of personal data the activity collects and processes, with the exact data items — these become the bullet points in the policy. The Handbook’s typical ELSA categories range from personal identification and contact information to meal details, transfer details, accommodation and event activity.',
      'Special categories (Art. 9 GDPR) need extra care: data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, trade-union membership, genetic or biometric data, and health data — which at ELSA events usually appears as dietary restrictions and allergies. Processing these is generally prohibited unless an exception applies; within ELSA the applicable exception is the individual’s EXPLICIT consent (Handbook Ch. 1.6.2).',
      'Click the 💡 next to a category for concrete examples of what belongs in it and when it applies to an event.',
    ],
  },
  sources: {
    chapter: 'Handbook Ch. 3.4.2',
    paragraphs: [
      'Direct collection means the data subject gives you the data themselves — e.g. through a website form, JotForm, Google Form, e-mail, or a document they fill out and send.',
      'Indirect collection means you receive the data WITHOUT the data subject’s involvement — e.g. a participant provides their emergency contact’s details, a coach registers the whole team, or a National Group forwards a participant list. The policy must state the source for indirectly collected data (GDPR Art. 14).',
    ],
  },
  purposes: {
    chapter: 'Handbook Ch. 3.4.3 (legal bases) & Ch. 5.2',
    paragraphs: [
      'Every purpose needs a legal basis. The GDPR offers six; in ELSA practice four carry almost everything:',
      'CONTRACT — processing needed to deliver what the person signed up for: registering participants, organising the programme, accommodation, transport, answering their requests. Test: could you deliver the event to this person without it? If not, contract fits. Example: an NCM cannot happen without registering who attends — contract. Charging the participation fee — contract.',
      'CONSENT — for genuinely optional things the person opts into: publishing their photos, adding them to a WhatsApp group, sending promotional material — and it is the required exception for special-category data like dietary/health information. Consent must be freely given, specific, informed and unambiguous, with no pre-ticked boxes, and as easy to withdraw as to give (Ch. 4.3.2 checklist). If someone could not realistically say no, consent is the wrong basis. Example from LeCercle Supporters: the WhatsApp invitation link is sent only where the person ticked the corresponding box on the registration form.',
      'LEGITIMATE INTEREST — treat this one with care. It is NOT a catch-all fallback for purposes that don’t fit elsewhere, even though it is often misused that way. It only works when three requirements are met (the balancing act, Ch. 3.4.3): (1) the interest is lawful, clear, real and present; (2) the processing is genuinely necessary for it — no reasonable less-intrusive way exists; and (3) it does not override the person’s rights and reasonable expectations. Good ELSA examples: keeping records of who participated (accountability), evaluating feedback to improve the next edition, keeping your forms and systems secure, sharing relevant ELSA opportunities with people already involved. Bad fits: publishing someone’s photos (use consent), processing health data (never — Art. 9 needs explicit consent), contacting people who have no relationship with ELSA. If you catch yourself picking legitimate interest because nothing else fits, stop and reconsider the purpose itself — and remember people can object at any time, so document your balancing reasoning.',
      'LEGAL OBLIGATION — processing the law requires: tax and accounting records (e.g. keeping payment records for years under national accounting law), notifying policy changes, establishing or defending legal claims.',
      'VITAL INTERESTS (life-or-death emergencies, e.g. actually calling an emergency contact) and PUBLIC INTEREST (task laid down in law) are rare at ELSA; the Annex 4 template has no fixed wording for them, so the tool flags them for the Data Protection team.',
      'Note that the person’s rights differ per basis (Ch. 5.2): e.g. the right to object applies to legitimate-interest processing, while consent is instead withdrawn; portability applies to consent- and contract-based processing.',
    ],
  },
  recipients: {
    chapter: 'Handbook Ch. 3.4.4',
    paragraphs: [
      'Recipients are everyone the data is shared with. Within ELSA: your Board/Team/Council, Local Groups, ELSA International, other Groups, Organising Committees. Outside ELSA: cloud and IT providers, form and payment platforms, meeting and messaging platforms, public authorities, partners, auditors, accommodations, restaurants, international organisations, speakers, venues.',
      'The (joint) controllers themselves — including their own Board, Team or OC — are NOT listed as recipients (Ch. 4.2). When sharing with third parties, a contractual basis (e.g. a data protection agreement) should exist.',
      'Transfers outside the EEA require safeguards: an EU adequacy decision (incl. the EU–US Data Privacy Framework where applicable) or standard contractual clauses. With ELSA’s standard Google/Gmail infrastructure, data typically reaches the United States — the policy’s §5b covers this with the SCC/adequacy wording. Name every non-EEA country and every international organisation involved.',
    ],
  },
  final: {
    chapter: 'Handbook Ch. 3.4.3 (retention) & Ch. 4.3.1 (changes)',
    paragraphs: [
      'Retention: keep data only as long as the purposes require — common ELSA periods are “until the end of the event”, the end of term (31 July), 2 years, or longer where the law requires (e.g. financial records). The policy’s retention section is fixed template text; your ROPA holds the specific periods.',
      'Policy changes: privacy policies must stay up to date. When your activities change, adapt the policy and notify the people concerned before the changes take effect — this tool uses a minimum notice period of 14 days.',
    ],
  },
};

/**
 * 💡 per purpose group: directions to think in, with example purposes that are
 * realistic for ELSA events (user request 2026-07-11).
 */
export const PURPOSE_GROUP_INFO: Record<string, CategoryInfo> = {
  'Registration & communication': {
    what: 'Everything needed to get people signed up and keep them informed.',
    examples: 'Register participants; confirm places; send practical updates; answer questions; check eligibility (ELSA membership, studies); manage waiting lists.',
    applies: 'Think: what happens between someone applying and them standing at your registration desk? Almost always contract-based.',
  },
  'Event logistics': {
    what: 'Running the event itself.',
    examples: 'Plan workshops and the social programme; arrange accommodation and rooming lists; organise transport and pick-ups; print name badges and certificates; manage attendance.',
    applies: 'Think: what do you organise FOR the participants during the event? Usually contract; emergencies via vital interests.',
  },
  'Medical & dietary': {
    what: 'Health-related care during the event (Art. 9 — explicit consent).',
    examples: 'Adapt meals to allergies and dietary restrictions; arrange accessibility (wheelchair access, rest rooms); account for medication needs at multi-day events.',
    applies: 'Think: what do you need to know so everyone can participate safely and fully? Always consent-based.',
  },
  'Media & publicity': {
    what: 'Showing the event to the outside world.',
    examples: 'Publish photos/aftermovies on Instagram or the website; livestream sessions; feature participants in newsletters; promote the next edition with this year’s impressions.',
    applies: 'Think: whose face or name leaves the room? Publication of identifiable people normally needs consent (opt-in on the form).',
  },
  'Finance & administration': {
    what: 'Money and internal organisation.',
    examples: 'Collect participation fees; process reimbursements; keep accounting records; manage the organising team; report to the Board or ELSA International.',
    applies: 'Think: fees and paperwork. Payments are contract; multi-year record-keeping is often a legal obligation; internal records legitimate interest.',
  },
  'Community & network': {
    what: 'Keeping people connected to ELSA beyond the event.',
    examples: 'WhatsApp/alumni groups (opt-in); share future ELSA opportunities; cooperate with international organisations (e.g. Council of Europe study visits); collect feedback to improve the next edition.',
    applies: 'Think: what continues after the closing ceremony? Opt-ins are consent; improvement and records are legitimate interest.',
  },
  'Compliance & legal': {
    what: 'What the law and good governance require.',
    examples: 'Notify privacy-policy changes; comply with tax, accounting and regulatory obligations; establish or defend legal claims.',
    applies: 'These three apply to virtually every ELSA activity — they are legal-obligation based and usually stay ticked.',
  },
  'Added / new purposes': {
    what: 'Purposes you added yourself.',
    examples: 'Anything specific to this event that the standard list misses.',
    applies: 'Give each one the right legal basis — if in doubt, read the 📖 above or ask dataprotection@elsa.org.',
  },
};

export interface CategoryInfo {
  what: string;
  examples: string;
  applies: string;
}

/** 💡 per data category: what it is, concrete examples, and when it applies to an event. */
export const CATEGORY_INFO: Record<string, CategoryInfo> = {
  'personal-identification': {
    what: 'Basic identity data of a person.',
    examples: 'Name, surname, date of birth, nationality, gender, passport or ID number, signature.',
    applies: 'Practically every event — registration lists, name badges, certificates, visa invitation letters (those need passport details).',
  },
  'contact-information': {
    what: 'Ways to reach a person.',
    examples: 'E-mail address, phone number, WhatsApp number, postal address, social-media handle.',
    applies: 'Practically every event — confirmations, updates, group chats, last-minute changes.',
  },
  'financial-information': {
    what: 'Payment and banking data.',
    examples: 'IBAN, account holder name, amounts paid or owed, invoices, reimbursement details.',
    applies: 'Any event with a participation fee, deposit, reimbursement or paid extras.',
  },
  'billing-contribution': {
    what: 'Recurring contribution / subscription data.',
    examples: 'Chosen contribution model, amount, frequency, subscription status, payment mandate.',
    applies: 'Programmes with recurring support (e.g. LeCercle Supporters) rather than one-off event fees.',
  },
  'elsa-activity': {
    what: 'The person’s position and history within ELSA.',
    examples: 'ELSA position, National/Local Group, membership status, alumni status, years active.',
    applies: 'Internal meetings, officer events, anything where eligibility or voting rights depend on the ELSA role.',
  },
  'emergency-contact': {
    what: 'Details of a third person to call in an emergency.',
    examples: 'Name, surname and phone number of a relative or friend.',
    applies: 'Physical events, especially with travel or overnight stays. Note: the emergency contact is a data subject too, and you receive their data indirectly (via the participant).',
  },
  'professional-educational': {
    what: 'Study and career background.',
    examples: 'CV, level of studies, current studies, occupation, education and knowledge background.',
    applies: 'Selective events (applications), speaker/trainer bios, traineeship-style programmes.',
  },
  'application-process': {
    what: 'Material submitted to apply.',
    examples: 'Motivation letter, answers to selection questions, references, evaluation scores of applicants.',
    applies: 'Any event with selection instead of first-come-first-served.',
  },
  'meal-details': {
    what: 'Meal choices (without health information).',
    examples: 'Selected menu per day, lunch yes/no.',
    applies: 'Events with catering. Careful: dietary restrictions and allergies are NOT meal details — they are health data (Art. 9).',
  },
  'health-data': {
    what: 'Special category (Art. 9) — data about health.',
    examples: 'Dietary restrictions, allergies, intolerances, disabilities, accessibility needs, medication, medical conditions.',
    applies: 'Almost every event with food or physical attendance asks this. Requires EXPLICIT consent — the tool adds the matching consent purpose automatically.',
  },
  'transfer-details': {
    what: 'Travel and pick-up information.',
    examples: 'Flight or train number, arrival and departure times, pick-up time and place.',
    applies: 'Events where you organise pick-ups, shuttles or coordinate arrivals.',
  },
  'accommodation-details': {
    what: 'Lodging information.',
    examples: 'Period of stay, room type, room preferences, roommate wishes.',
    applies: 'Multi-day events where you arrange the hostel/hotel and rooming lists.',
  },
  'additional-services': {
    what: 'Optional purchases and extras.',
    examples: 'Merchandise (and sizes), gala tickets, excursions, extra nights, services and prices.',
    applies: 'Events selling optional extras alongside the base participation.',
  },
  'event-activity': {
    what: 'What the person does during the event.',
    examples: 'Workshops chosen, attendance/presences, roles taken (chair, committee), statements in minutes, competition scores and results.',
    applies: 'Council meetings (minutes!), competitions (scores, pleadings), law schools (attendance, certificates).',
  },
  'photos-recordings': {
    what: 'Images and recordings of identifiable people.',
    examples: 'Photos, video, livestreams, recordings of sessions, social-media posts.',
    applies: 'Any event with a photographer or social-media coverage. Publication normally relies on consent — put an opt-in (or at least a clear notice with objection option) on the registration form.',
  },
  'communication-data': {
    what: 'Messages people send you.',
    examples: 'E-mails, inquiries, requests, complaints and the information inside them.',
    applies: 'Practically every event — whenever participants can contact you.',
  },
  'religious-beliefs': {
    what: 'Special category (Art. 9) — religious or philosophical beliefs.',
    examples: 'Halal/kosher meal requests can reveal religion; prayer-room needs; faith-based dietary rules.',
    applies: 'Only tick if you actually record this. A generic “dietary restrictions” field is usually health data instead; explicit consent required either way.',
  },
  'political-opinions': {
    what: 'Special category (Art. 9) — political opinions.',
    examples: 'Party membership, positions taken in a political capacity, affiliations collected for a panel.',
    applies: 'Rare at ELSA — only if the activity genuinely records political views. Explicit consent required.',
  },
  'trade-union': {
    what: 'Special category (Art. 9) — trade-union membership.',
    examples: 'Union membership status, e.g. for member discounts or union-hosted sessions.',
    applies: 'Rare at ELSA. Explicit consent required.',
  },
};
