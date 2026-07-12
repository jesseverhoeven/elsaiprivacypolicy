import { useMemo, useState } from 'react';
import type { Answers, ProcessorEntry } from '../types';
import {
  DATA_SUBJECT_OPTIONS, DATA_CATEGORY_DEFS, SOURCE_OPTIONS,
  INTERNAL_RECIPIENT_OPTIONS, EXTERNAL_RECIPIENT_OPTIONS,
  LEGAL_BASIS_DEFS, CONSENT_BANNER_CHECKLIST, PURPOSE_GROUPS, PURPOSE_SUGGESTIONS,
  ELSA_INTERNATIONAL_CONTACT,
} from '../data/picklists';
import { SUPERVISORY_AUTHORITIES } from '../data/supervisoryAuthorities';
import { presetById, type AttentionSection } from '../data/presets';
import { SECTION_INFO, CATEGORY_INFO, PURPOSE_GROUP_INFO } from '../data/handbookInfo';
import { findGaps, specialCategoriesSelected } from '../logic/gaps';
import type { AnalysisResult } from '../logic/analyze';

/**
 * 📖 next to a heading — click (not hover) toggles a light-blue box with the
 * in-depth Handbook explanation for that topic (user decision 2026-07-11).
 */
function InfoBook({ topic }: { topic: string }) {
  const [open, setOpen] = useState(false);
  const info = SECTION_INFO[topic];
  if (!info) return null;
  return (
    <>
      <button
        type="button" className="info-book" aria-expanded={open}
        title={open ? 'Hide the Handbook explanation' : 'Read the Handbook explanation'}
        onClick={() => setOpen(!open)}
      >
        📖
      </button>
      {open && (
        <div className="info-box" role="note">
          <span className="info-chapter">{info.chapter}</span>
          {info.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
    </>
  );
}

/**
 * Double-click-to-edit wording for pick-list items (user feedback 2026-07-11):
 * the standard label often almost covers it and only needs a small addition.
 * A single click on the text is swallowed (preventDefault) so editing never
 * toggles the checkbox — ticking happens on the checkbox itself.
 */
function EditableText({ value, onSave, ariaLabel }: {
  value: string; onSave: (v: string) => void; ariaLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing) {
    return (
      <span
        className="editable-text" title="Double-click to adjust the wording"
        onClick={(e) => e.preventDefault()}
        onDoubleClick={(e) => { e.preventDefault(); setDraft(value); setEditing(true); }}
      >
        {value}
      </span>
    );
  }
  return (
    <input
      className="editable-text-input" value={draft} autoFocus aria-label={ariaLabel}
      onClick={(e) => e.preventDefault()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); if (draft.trim() && draft.trim() !== value) onSave(draft.trim()); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
    />
  );
}

interface Props {
  answers: Answers;
  setAnswers: (a: Answers) => void;
  analysis: AnalysisResult | null;
  presetMarks: Set<string>;
  onBack: () => void;
  onContinue: () => void;
}

function ChipInput({ values, onChange, placeholder, id, validate }: {
  values: string[]; onChange: (v: string[]) => void; placeholder: string; id: string;
  validate?: (v: string) => string | null;
}) {
  const [error, setError] = useState('');
  return (
    <div className="chipinput">
      <div className="chips">
        {values.map((v, i) => (
          <span className="chip added" key={i}>
            ✓ {v}
            <button className="chip-x" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((_, j) => j !== i))}>×</button>
          </span>
        ))}
      </div>
      <input
        id={id} placeholder={placeholder}
        onKeyDown={(e) => {
          const t = e.currentTarget;
          if (e.key === 'Enter' && t.value.trim()) {
            e.preventDefault();
            const v = t.value.trim();
            const problem = validate?.(v) ?? null;
            if (problem) { setError(problem); return; }
            setError('');
            onChange([...values, v]);
            t.value = '';
          }
        }}
      />
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  );
}

export function StepGaps({ answers, setAnswers, analysis, presetMarks, onBack, onContinue }: Props) {
  const gaps = useMemo(() => findGaps(answers), [answers]);
  const blocking = gaps.filter((g) => g.blocking);
  const special = specialCategoriesSelected(answers);
  const set = (patch: Partial<Answers>) => setAnswers({ ...answers, ...patch });
  const [recipientError, setRecipientError] = useState('');
  const [openBulb, setOpenBulb] = useState<string | null>(null);
  const preset = presetById(answers.presetId);

  /** Orange marking for values pre-filled from the chosen preset (previous approved policy). */
  const mk = (key: string) => (presetMarks.has(key) ? ' from-preset' : '');

  /* ---------- Item-specific hover tips (↻ = carried over from the previous policy).
     Short and customised per item — what typically changes between editions
     (user decision 2026-07-11). Section-wide guidance lives in the visible remark
     block under each heading instead. ---------- */

  const CATEGORY_TIPS: Record<string, string> = {
    'personal-identification': 'Are passport or ID details needed this edition (e.g. visa invitation letters), or just name and surname?',
    'contact-information': 'Have the contact channels changed this edition (phone, WhatsApp, postal address)?',
    'financial-information': 'Same payment method this edition (IBAN transfer, payment provider)? Any deposits or reimbursements?',
    'billing-contribution': 'Same contribution models, amounts and payment provider as last time?',
    'elsa-activity': 'Is membership/position information still asked on the form?',
    'emergency-contact': 'Is an emergency contact still collected at registration?',
    'professional-educational': 'Is a CV, study background or motivation still part of the application?',
    'application-process': 'Has the application changed (motivation letter, references, selection rounds)?',
    'meal-details': 'Are meals provided this edition, and is meal choice asked on the form?',
    'health-data': 'Same dietary/allergy questions on this edition’s form? Any changed or added medical or accessibility questions? This stays Art. 9 data — explicit consent needed.',
    'transfer-details': 'Are pick-ups, flights or transport organised this edition?',
    'accommodation-details': 'Same accommodation setup (hotel/hostel, room preferences) this edition?',
    'additional-services': 'Which extras are sold this edition (merch, gala tickets, trips)?',
    'event-activity': 'Do the tracked activities match this edition’s programme (workshops, attendance, roles)?',
    'photos-recordings': 'Is a photographer or videographer present again? Livestreams or social-media coverage?',
    'communication-data': 'Usually unchanged — inquiries and messages participants send you.',
    'religious-beliefs': 'Only if actually asked (e.g. religious dietary needs, prayer room) — Art. 9, explicit consent needed.',
    'political-opinions': 'Only if actually collected in this activity’s context — Art. 9, explicit consent needed.',
    'trade-union': 'Only if actually collected — Art. 9, explicit consent needed.',
  };
  const catTip = (id: string): string | undefined =>
    presetMarks.has(`cat:${id}`)
      ? (id.startsWith('custom:')
        ? 'Carried over from the previous policy — is this still collected this edition, and are the items accurate?'
        : CATEGORY_TIPS[id] ?? 'Still collected this edition? Check the listed items match this edition’s form.')
      : undefined;

  // Neutral, event-connected basis tips — they must fit any activity, internal or
  // external, not just event participants (user feedback 2026-07-12). Phrased as
  // "is this basis still in place for <this activity>?".
  const ev = answers.activityTitle.trim() || 'this activity';
  const PURPOSE_TIPS: Record<string, string> = {
    contract: `Contractual basis: is this still needed to perform an agreement with the people involved in ${ev} — e.g. a registration, participation, a voluntary agreement, or a service you provide? If that agreement still applies, keep it.`,
    consent: `Consent basis: wherever this data is collected for ${ev}, is a matching opt-in still offered — unticked by default and just as easy to refuse or withdraw?`,
    legitimateInterest: `Legitimate-interest basis: is the interest behind this still real for ${ev} and proportionate, without overriding the rights of the people involved? If so, it still holds.`,
    legalObligation: `Legal-obligation basis: does a law or regulation still require this for ${ev}? Usually unchanged, but confirm it still applies.`,
    publicInterest: 'Public-interest basis: no template wording exists for it — it will be flagged; check with dataprotection@elsa.org that it still applies.',
    vitalInterests: `Vital-interests basis: used to protect someone’s life or safety (e.g. contacting an emergency contact) — is that still relevant for ${ev}?`,
  };
  const purposeTip = (id: string, basis: string): string | undefined =>
    presetMarks.has(`purpose:${id}`) ? PURPOSE_TIPS[basis] : undefined;

  const RECIPIENT_TIPS: Record<string, string> = {
    'cloud-providers': 'Standard ELSA infrastructure (Google Workspace/Gmail) — usually unchanged.',
    'it-providers': 'Standard ELSA infrastructure — usually unchanged.',
    'form-platforms': 'Same registration platform this edition (JotForm, Google Forms, website form)?',
    'payment-providers': 'Same payment provider this edition?',
    'messaging-platforms': 'Is the group chat / WhatsApp community still used this edition?',
    'meeting-platforms': 'Same meeting tools this edition (Zoom, Google Meet…)?',
    'public-agencies': 'Usually unchanged — only where a legal obligation requires sharing.',
    'partner-organisations': 'Same partners and sponsors this edition?',
    'auditors-payroll': 'Usually unchanged.',
    'accommodations': 'Which hotel/hostel receives the rooming list this edition?',
    'restaurants': 'Same caterers, restaurants or venues this edition?',
    'international-orgs': 'Is data still shared with this organisation this edition (affects the transfers section)?',
    'partners': 'Same partners this edition?',
    'speakers': 'External speakers again this edition?',
    'event-organisers': 'Same venues or institutions this edition?',
  };
  const recipTip = (key: 'ri' | 're', label: string): string | undefined => {
    if (!presetMarks.has(`${key}:${label}`)) return undefined;
    const opt = [...INTERNAL_RECIPIENT_OPTIONS, ...EXTERNAL_RECIPIENT_OPTIONS].find((o) => o.label === label);
    return (opt && RECIPIENT_TIPS[opt.id]) ?? 'Carried over from the previous policy — does this party still receive data this edition?';
  };

  const dsTip = (label: string): string | undefined =>
    presetMarks.has(`ds:${label}`) ? 'Covered by the previous policy — does this audience take part again this edition?' : undefined;

  /**
   * Ticking a special-category (Art. 9) data category auto-adds the matching
   * consent purpose under "Medical & dietary" (user decision 2026-07-11), so the
   * consent-purpose requirement is solved rather than left as a blocker.
   */
  function toggleCategory(id: string, checked: boolean) {
    let purposes = answers.purposes;
    const def = DATA_CATEGORY_DEFS.find((d) => d.id === id);
    if (checked && def?.special) {
      const cat = answers.dataCategories.find((c) => c.id === id);
      const items = (cat?.items ?? def.defaultItems).toLowerCase();
      const wanted = items.match(/dietary|allerg|meal|food/) || id === 'health-data'
        ? 'To provide meals adapted to dietary restrictions and allergies'
        : 'To process health data in order to accommodate medical, accessibility and other special requirements during the event';
      if (!purposes.some((p) => p.enabled && p.basis === 'consent')) {
        purposes = purposes.map((p) => p.text === wanted ? { ...p, enabled: true, basis: 'consent' as const } : p);
      }
    }
    set({
      dataCategories: answers.dataCategories.map((x) => x.id === id ? { ...x, enabled: checked } : x),
      purposes,
    });
  }

  /**
   * Inline notes next to the relevant question (user decision 2026-07-10):
   * orange = attention points from the approved policy ("still applicable?");
   * green = corroborated by the information the officer provided in step 1.
   */
  function SectionNote({ section, showAttention = true }: { section: AttentionSection; showAttention?: boolean }) {
    // Visible remark block under each heading: brief, customised guidance from the
    // previous policy (questions to ask yourself). Item-specific "what changed"
    // tips live in the per-item hover tooltips. Green/orange checks below verify
    // against the information the officer provided.
    const points = showAttention ? (preset?.attentionPoints.filter((p) => p.section === section) ?? []) : [];
    const checks: { status: 'ok' | 'warn'; text: string }[] = [];
    if (analysis) {
      if (section === 'controller' && analysis.activityTitleGuess) {
        // The event name is never pre-filled from free text (too error-prone) —
        // the guess is offered here as a suggestion instead.
        const guess = analysis.activityTitleGuess;
        const title = answers.activityTitle.trim();
        if (!title) {
          checks.push({ status: 'warn', text: `Your information suggests the event is “${guess}” — if that is right, fill it in as the event name above (it is deliberately not pre-filled).` });
        } else if (title.toLowerCase().includes(guess.toLowerCase()) || guess.toLowerCase().includes(title.toLowerCase())) {
          checks.push({ status: 'ok', text: 'Checked against the information you provided — the event name matches.' });
        } else {
          checks.push({ status: 'warn', text: `Your information mentions “${guess}”, but the event name above is “${title}” — double-check which is right.` });
        }
      }
      if (section === 'controller' && analysis.groupNames.length > 0) {
        const found = analysis.groupNames[0];
        const match = answers.controller.name.toLowerCase().includes(found.toLowerCase())
          || found.toLowerCase().includes(answers.controller.name.toLowerCase());
        checks.push(match
          ? { status: 'ok', text: `Checked against the information you provided — it also names ELSA ${found} as organiser.` }
          : { status: 'warn', text: `Your information mentions ELSA ${found}, but the pre-filled controller is ELSA ${answers.controller.name} — double-check who the controller is.` });
      }
      if (section === 'categories' && analysis.dataCategoryIds.length > 0) {
        const missing = analysis.dataCategoryIds.filter((id) => !answers.dataCategories.some((c) => c.id === id && c.enabled));
        checks.push(missing.length === 0
          ? { status: 'ok', text: 'Checked against the information you provided — every data category it mentions is ticked.' }
          : { status: 'warn', text: `Your information mentions: ${missing.map((id) => DATA_CATEGORY_DEFS.find((d) => d.id === id)?.label ?? id).join(', ')} — deliberately not pre-ticked; tick the ones you actually collect.` });
      }
      if (section === 'purposes' && analysis.purposeTexts.length > 0) {
        // Purposes are never auto-ticked from free text — suggested here instead.
        const missing = analysis.purposeTexts.filter((t) => !answers.purposes.some((p) => p.enabled && p.text === t));
        checks.push(missing.length === 0
          ? { status: 'ok', text: 'Checked against the information you provided — the purposes it suggests are all ticked.' }
          : { status: 'warn', text: `Your information suggests these purposes (deliberately not pre-ticked): ${missing.map((t) => `“${t}”`).join('; ')} — tick the ones that apply.` });
      }
      if (section === 'recipients' && analysis.externalRecipientIds.length > 0) {
        const labels = analysis.externalRecipientIds
          .map((id) => EXTERNAL_RECIPIENT_OPTIONS.find((o) => o.id === id)?.label)
          .filter((l): l is string => !!l);
        const missing = labels.filter((l) => !answers.recipientsExternal.includes(l));
        checks.push(missing.length === 0
          ? { status: 'ok', text: 'Checked against the information you provided — the recipients it mentions are selected.' }
          : { status: 'warn', text: `Your information also suggests: ${missing.join('; ')} — select them if data is shared with them.` });
      }
      if (section === 'transfers' && analysis.thirdCountries.length > 0) {
        const missing = analysis.thirdCountries.filter((c) =>
          !answers.thirdCountries.some((t) => t.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(t.toLowerCase().replace(/^the /, ''))));
        checks.push(missing.length === 0
          ? { status: 'ok', text: 'Checked against the information you provided — the countries it mentions are listed.' }
          : { status: 'warn', text: `Your information mentions ${missing.join(', ')} — add them if data goes there.` });
      }
    }
    if (points.length === 0 && checks.length === 0) return null;
    return (
      <div className="section-notes">
        {points.map((p, i) => (
          <p className="note-attention" key={`a${i}`} role="note">↻ {p.text}</p>
        ))}
        {checks.map((c, i) => (
          <p className={c.status === 'ok' ? 'note-verified' : 'note-attention'} key={`c${i}`} role="note">
            {c.status === 'ok' ? '✓ ' : '⚠ '}{c.text}
          </p>
        ))}
      </div>
    );
  }

  /** Handbook Ch. 4.2: the controllers themselves (incl. their Board/Team/OC) are never listed as recipients. */
  function controllerMatchReason(label: string): string | null {
    const l = label.toLowerCase();
    const names = [answers.controller.name, answers.jointController.name].filter((n) => n.trim().length > 2);
    for (const n of names) {
      if (l.includes(n.toLowerCase())) {
        // ELSA group names are stored without the "ELSA" prefix — show the full name.
        const display = /^elsa\b|organising|organizing/i.test(n) ? n : `ELSA ${n}`;
        return `“${label}” matches the (joint) controller “${display}”. The (joint) controllers themselves — including ` +
          'their own Board, Team or OC — are never listed as recipients (Handbook Ch. 4.2), so this option is blocked automatically.';
      }
    }
    if (answers.controllerKind === 'joint' && /organising committee|organizing committee|\boc\b/i.test(answers.jointController.name)
      && /organising committee/i.test(label)) {
      return 'Your Organising Committee is a joint controller here. The (joint) controllers themselves — including their ' +
        'own Board, Team or OC — are never listed as recipients (Handbook Ch. 4.2), so this option is blocked automatically.';
    }
    return null;
  }

  const elsaIntlFilled =
    answers.controller.name === ELSA_INTERNATIONAL_CONTACT.name &&
    answers.controller.email === ELSA_INTERNATIONAL_CONTACT.email;

  /**
   * Built-in purposes carry the id `p<index>` into PURPOSE_SUGGESTIONS (see
   * defaultAnswers). Resolving the definition by id — not by text — keeps a
   * purpose in its theme group after its wording is edited.
   */
  function purposeDef(id: string) {
    const m = /^p(\d+)$/.exec(id);
    return m ? PURPOSE_SUGGESTIONS[Number(m[1])] : undefined;
  }

  /** Custom purposes join an existing theme where the text matches its keywords; otherwise "Added / new purposes". */
  function groupForCustomPurpose(text: string): string {
    const t = text.toLowerCase();
    for (const s of PURPOSE_SUGGESTIONS) {
      if (s.keywords.some((k) => t.includes(k))) return s.group;
    }
    return 'Added / new purposes';
  }

  const detected = analysis
    ? [
        analysis.groupNames.length > 0 && `ELSA group “${analysis.groupNames[0]}”`,
        analysis.activityTitleGuess && `event “${analysis.activityTitleGuess}”`,
        analysis.dataCategoryIds.length > 0 && `${analysis.dataCategoryIds.length} data categories`,
        analysis.purposeTexts.length > 0 && `${analysis.purposeTexts.length} likely purposes`,
        analysis.sourceIds.length > 0 && `${analysis.sourceIds.length} data sources`,
        analysis.externalRecipientIds.length > 0 && `${analysis.externalRecipientIds.length} third-party recipients`,
        analysis.art9Signals.length > 0 && `⚠ possible sensitive (Art. 9) data`,
      ].filter(Boolean) as string[]
    : [];

  const customCategories = answers.dataCategories.filter((c) => c.id.startsWith('custom:'));
  const standardCategories = answers.dataCategories.filter((c) => !c.id.startsWith('custom:'));

  return (
    <section className="step">
      <h2>Step 2 · Complete &amp; check</h2>
      <p className="icons-legend">
        <span>📖 click for the Handbook explanation of a topic</span>
        <span>💡 click for examples to judge whether something applies to your event</span>
        {(preset || presetMarks.size > 0) && <span><span className="from-preset-example">↻</span> = carried over from the previous policy — hover it for what typically changes</span>}
      </p>
      {detected.length > 0 && (
        <p className="lead">From your information the tool recognised: {detected.join(' · ')}. Everything below is a
          suggestion — please review each field; the tool proposes, you decide.
          {preset && <> Values marked <span className="from-preset-example">↻</span> come from the approved {preset.name} policy;
          hover a marked item (↻) for what typically changes between editions.</>}
        </p>
      )}
      {!preset && presetMarks.size > 0 && (
        <p className="lead">An uploaded previous privacy policy was recognised: everything marked{' '}
          <span className="from-preset-example">↻</span> below was copied 1-on-1 from it — purposes, data categories
          (with their exact items), data subjects, recipients, sources and transfers — the same way a previous event
          pre-fills. Review each value: this edition may differ from the uploaded policy.</p>
      )}
      {preset && detected.length === 0 && (
        <p className="lead">Everything below is pre-filled from the previous <b>{preset.name}</b> policy
          {preset.lastUpdated ? ` (last updated ${preset.lastUpdated})` : ''} and marked{' '}
          <span className="from-preset-example">↻</span> — carried over, not a warning. Each section starts with a
          short ↻ note with questions to ask yourself, and <b>hovering a marked item (↻)</b> shows what typically
          changes for exactly that item. Still think about how this year’s event differs so the policy truly fits it.
          You are in good hands — you can do this!</p>
      )}

      <div className="gaps-layout">
        <div className="gaps-form">

          <div className="card">
            <h3>The event &amp; the controller <InfoBook topic="controller" /></h3>
            <SectionNote section="controller" />
            <div className="grid2">
              <label className={mk('field:activityTitle')}>Event / processing activity
                <input value={answers.activityTitle} onChange={(e) => set({ activityTitle: e.target.value })}
                  placeholder="e.g. the National Council Meeting 2026" />
              </label>
              <label>Whom is the policy mainly for?
                <select value={answers.audience} onChange={(e) => set({ audience: e.target.value as Answers['audience'] })}>
                  <option value="">Default option (safest): neutral wording, fits both</option>
                  <option value="participants">External — event participants / guests (incl. ELSA members attending)</option>
                  <option value="volunteers">Internal — ELSA officers, volunteers or ELSA groups (recruitment, management, internal reporting)</option>
                </select>
                <span className="hint">Never preselected. This only affects the phrasing of a few template sentences —
                  unset, the policy uses neutral wording (e.g. “We collect personal data about you in different ways, as
                  described within this privacy policy”) that fits internal and external alike. ELSA members attending an
                  event count as external participants; choose internal for officer recruitment/management or when ELSA
                  International collects information from other ELSA groups (e.g. establishing an ICE, National Group
                  Reports).</span>
              </label>
            </div>

            <div className="role-block controller-block">
              <span className="role-tag controller-tag">Controller</span>
              <div className="quickfill">
                <button
                  type="button" className={elsaIntlFilled ? 'ghost-navy active' : 'ghost-navy'}
                  onClick={() => set(elsaIntlFilled
                    ? { controller: { name: '', address: '', email: '', phone: '' }, controllerCountry: '' }
                    : { controller: { ...ELSA_INTERNATIONAL_CONTACT }, controllerCountry: 'BE' })}
                >
                  {elsaIntlFilled ? '× Clear: ELSA International' : 'Quick-fill: ELSA International'}
                </button>
                <span className="hint">Boulevard Général Jacques 239, Brussels B-1050, Belgium · elsa@elsa.org · +32 2 646 2626</span>
              </div>
              <div className="grid2">
                <label className={mk('field:controller')}>ELSA group / entity name (controller)
                  <input value={answers.controller.name} onChange={(e) => set({ controller: { ...answers.controller, name: e.target.value } })}
                    placeholder="e.g. International, The Netherlands, Leuven, International Organising Committee (IM team)…" />
                </label>
                <label className={mk('field:controllerCountry')}>Country
                  <select value={answers.controllerCountry} onChange={(e) => set({ controllerCountry: e.target.value })}>
                    <option value="">— choose —</option>
                    {SUPERVISORY_AUTHORITIES.map((s) => <option key={s.iso} value={s.iso}>{s.country}</option>)}
                  </select>
                </label>
                <label className={mk('field:controller')}>Address
                  <input value={answers.controller.address} onChange={(e) => set({ controller: { ...answers.controller, address: e.target.value } })}
                    placeholder="Street, City, Country" />
                </label>
                <label className={mk('field:controller')}>E-mail (primary)
                  <input type="email" value={answers.controller.email} onChange={(e) => set({ controller: { ...answers.controller, email: e.target.value } })}
                    placeholder="position@xx.elsa.org" />
                </label>
                <label>Phone
                  <input value={answers.controller.phone} onChange={(e) => set({ controller: { ...answers.controller, phone: e.target.value } })} />
                </label>
                <label>Data-protection contact (optional)
                  <input value={answers.dpoContact} onChange={(e) => set({ dpoContact: e.target.value })}
                    placeholder="only if your group has one" />
                </label>
              </div>
              <span className="fieldlabel">More e-mail addresses (optional)</span>
              <ChipInput id="extra-emails" values={answers.extraEmails} onChange={(v) => set({ extraEmails: v })}
                placeholder="e.g. president@elsa.org — press Enter to add" />

              <label className="checkline">
                <input type="checkbox" checked={answers.controllerKind === 'joint'}
                  onChange={(e) => set({ controllerKind: e.target.checked ? 'joint' : 'controller' })} />
                We organise together with another group / an Organising Committee (<b>joint controllers</b>)
              </label>
              {answers.controllerKind === 'joint' && (
                <div className="grid2 subpanel">
                  <label>Joint controller name
                    <input value={answers.jointController.name} onChange={(e) => set({ jointController: { ...answers.jointController, name: e.target.value } })}
                      placeholder="e.g. ELSA Ghent / the OC of the NCM" />
                  </label>
                  <label>Joint controller address
                    <input value={answers.jointController.address} onChange={(e) => set({ jointController: { ...answers.jointController, address: e.target.value } })} />
                  </label>
                  <label>Joint controller e-mail
                    <input value={answers.jointController.email} onChange={(e) => set({ jointController: { ...answers.jointController, email: e.target.value } })} />
                  </label>
                  <div className="sole-purposes">
                    <span className="fieldlabel">Purposes handled by YOUR group alone (optional)</span>
                    <span className="hint">Usually none — tick only purposes that are yours alone, not shared with the
                      joint controller (Handbook Ch. 4.2 “About us — if applicable”). Pick from the purposes you selected
                      below; they appear in §1 of the policy, marked as yours alone.</span>
                    {answers.purposes.filter((p) => p.enabled).length === 0 ? (
                      <span className="hint">Select purposes in the “Why do you process the data?” section first — they
                        become tickable here.</span>
                    ) : (
                      answers.purposes.filter((p) => p.enabled).map((p) => (
                        <label className="checkline" key={p.id}>
                          <input type="checkbox"
                            checked={answers.soleControllerPurposeIds.includes(p.id)}
                            onChange={(e) => set({
                              soleControllerPurposeIds: e.target.checked
                                ? [...answers.soleControllerPurposeIds, p.id]
                                : answers.soleControllerPurposeIds.filter((x) => x !== p.id),
                            })} />
                          {p.text}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="role-block processor-block">
              <span className="role-tag processor-tag">Processor</span>
              <label className="checkline processor-toggle">
                <input type="checkbox" checked={answers.usesProcessors}
                  onChange={(e) => set({ usesProcessors: e.target.checked })} />
                <span>We use a <b>processor or sub-processor</b> — a party that processes data on our instructions, such
                  as a registration platform, mailing service or payment provider (not a controller).</span>
              </label>
              {answers.usesProcessors && (
                <div className="subpanel">
                  {answers.processors.map((p, i) => (
                    <div className="processor-row" key={i}>
                      <input value={p.name} placeholder="Name (e.g. JotForm Inc.)" aria-label="Processor name"
                        onChange={(e) => set({ processors: answers.processors.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
                      <select value={p.kind} aria-label="Processor kind"
                        onChange={(e) => set({ processors: answers.processors.map((x, j) => j === i ? { ...x, kind: e.target.value as ProcessorEntry['kind'] } : x) })}>
                        <option value="processor">processor</option>
                        <option value="subprocessor">sub-processor</option>
                      </select>
                      <input value={p.contact} placeholder="Contact info (e-mail / address)" aria-label="Processor contact"
                        onChange={(e) => set({ processors: answers.processors.map((x, j) => j === i ? { ...x, contact: e.target.value } : x) })} />
                      <button className="cut" title="Remove processor" aria-label="Remove processor"
                        onClick={() => set({ processors: answers.processors.filter((_, j) => j !== i) })}>✕</button>
                    </div>
                  ))}
                  <button className="ghost-navy" onClick={() => set({ processors: [...answers.processors, { name: '', kind: 'processor', contact: '' }] })}>
                    + Add processor
                  </button>
                  <p className="hint">Processors are listed among the data recipients in §5 of the policy, marked as
                    “data processor” — clearly distinct from the controller(s). A data processing agreement should be in
                    place with each of them.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Whose data do you process? (data subjects) <InfoBook topic="subjects" /></h3>
            <SectionNote section="subjects" />
            {presetMarks.has('warn:subjects') && (
              <p className="note-warn" role="note">
                ⚠ <b>Check whose data you process.</b> The previous policy did not clearly state its data subjects, so
                this is a <b>calculated guess</b> (from the event name and audience) rather than something copied from the
                document. Please confirm or correct the selection below before generating.
              </p>
            )}
            <div className="checkgrid">
              {DATA_SUBJECT_OPTIONS.map((d) => (
                <label className={`checkline${mk(`ds:${d.label}`)}`} key={d.id} data-tip={dsTip(d.label)}>
                  <input type="checkbox"
                    checked={answers.dataSubjects.includes(d.label)}
                    onChange={(e) => set({
                      dataSubjects: e.target.checked
                        ? [...answers.dataSubjects, d.label]
                        : answers.dataSubjects.filter((s) => s !== d.label),
                    })} />
                  {d.label}
                </label>
              ))}
            </div>
            <span className="fieldlabel">Other data subjects</span>
            <ChipInput
              id="ds-other"
              values={answers.dataSubjectsOther ? answers.dataSubjectsOther.split(';').map((s) => s.trim()).filter(Boolean) : []}
              onChange={(v) => set({ dataSubjectsOther: v.join('; ') })}
              placeholder="type and press Enter to add (e.g. photographers)"
            />
          </div>

          <div className="card">
            <h3>Which personal data do you collect? <InfoBook topic="categories" /></h3>
            <SectionNote section="categories" />
            <p className="hint">Tick the categories and adjust the exact data items — they appear as bullet points in the
              policy. Double-click a category name to fine-tune its wording (a single click never ticks the box).</p>
            {standardCategories.map((c) => {
              const def = DATA_CATEGORY_DEFS.find((d) => d.id === c.id)!;
              return (
                <div className={`catline ${c.enabled ? 'on' : ''}${mk(`cat:${c.id}`)}`} key={c.id}
                  data-tip={catTip(c.id)}>
                  <div className="catline-row">
                    <label className="checkline">
                      <input type="checkbox" checked={c.enabled}
                        onChange={(e) => toggleCategory(c.id, e.target.checked)} />
                      <b><EditableText value={c.customLabel ?? def.label} ariaLabel={`Rename category ${def.label}`}
                        onSave={(v) => set({
                          dataCategories: answers.dataCategories.map((x) => x.id === c.id ? { ...x, customLabel: v } : x),
                        })} /></b>
                      {def.special && <span className="special-badge" title="Special category — Art. 9 GDPR">Art. 9 — sensitive</span>}
                    </label>
                    {CATEGORY_INFO[c.id] && (
                      <button
                        type="button" className="bulb" aria-expanded={openBulb === c.id}
                        title="What belongs in this category, with examples"
                        onClick={() => setOpenBulb(openBulb === c.id ? null : c.id)}
                      >
                        💡
                      </button>
                    )}
                  </div>
                  {openBulb === c.id && CATEGORY_INFO[c.id] && (
                    <div className="info-box bulb-box" role="note">
                      <p><b>{CATEGORY_INFO[c.id].what}</b></p>
                      <p><b>Examples:</b> {CATEGORY_INFO[c.id].examples}</p>
                      <p><b>When it applies:</b> {CATEGORY_INFO[c.id].applies}</p>
                    </div>
                  )}
                  {c.enabled && (
                    <input className="items" value={c.items} aria-label={`Data items for ${def.label}`}
                      onChange={(e) => set({
                        dataCategories: answers.dataCategories.map((x) => x.id === c.id ? { ...x, items: e.target.value } : x),
                      })} />
                  )}
                </div>
              );
            })}
            {customCategories.map((c) => (
              <div className={`catline on${mk(`cat:${c.id}`)}`} key={c.id}
                data-tip={catTip(c.id)}>
                <label className="checkline">
                  <input type="checkbox" checked={c.enabled}
                    onChange={(e) => set({
                      dataCategories: e.target.checked
                        ? answers.dataCategories.map((x) => x.id === c.id ? { ...x, enabled: true } : x)
                        : answers.dataCategories.filter((x) => x.id !== c.id),
                    })} />
                  <b><EditableText value={c.customLabel ?? c.id} ariaLabel={`Rename category ${c.customLabel}`}
                    onSave={(v) => set({
                      dataCategories: answers.dataCategories.map((x) => x.id === c.id ? { ...x, customLabel: v } : x),
                    })} /></b>
                  <span className="custom-badge">added category</span>
                </label>
                <input className="items" value={c.items} aria-label={`Data items for ${c.customLabel}`}
                  onChange={(e) => set({
                    dataCategories: answers.dataCategories.map((x) => x.id === c.id ? { ...x, items: e.target.value } : x),
                  })} />
              </div>
            ))}
            <span className="fieldlabel">Add your own category</span>
            <ChipInput
              id="custom-cat"
              values={[]}
              onChange={(v) => {
                const label = v[v.length - 1];
                if (!label) return;
                set({
                  dataCategories: [...answers.dataCategories, {
                    id: `custom:${label}-${Date.now()}`, customLabel: label, items: '', enabled: true,
                  }],
                });
              }}
              placeholder="e.g. Vehicle details — press Enter to add"
            />
          </div>

          {special.length > 0 && (
            <div className="card art9">
              <h3>⚠ Sensitive data safeguard (Art. 9 GDPR)</h3>
              <p>
                You collect <b>{special.join(' and ')}</b> — special categories of personal data. Under the Handbook
                (Ch. 1.6.2) this is generally prohibited to process, except with the individual’s <b>explicit consent</b>.
                Your registration form therefore needs a consent question that meets this checklist (Handbook Ch. 4.3.2):
              </p>
              <ul className="hint">
                {CONSENT_BANNER_CHECKLIST.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
              <label className="checkline strong">
                <input type="checkbox" checked={answers.explicitConsentConfirmed}
                  onChange={(e) => set({ explicitConsentConfirmed: e.target.checked })} />
                We will collect explicit consent for this data where it is gathered
              </label>
              {answers.purposes.some((p) => p.enabled && p.basis === 'consent') ? (
                <p className="hint">✓ A matching consent purpose is listed under “Medical &amp; dietary” in the purposes
                  below — adjust it there if needed.</p>
              ) : (
                <p className="hint">Also list at least one purpose under the legal basis “Consent” below (see the
                  “Medical &amp; dietary” group).</p>
              )}
            </div>
          )}

          <div className="card">
            <h3>How do you collect the data? <InfoBook topic="sources" /></h3>
            <p className="hint">Direct = the person gives it to you themselves; indirect = you receive it another way
              (e.g. from their emergency contact, another group, a coach).</p>
            <div className="grid2">
              <div>
                <span className="fieldlabel collect-label">Directly, via:</span>
                {SOURCE_OPTIONS.map((s) => (
                  <label className="checkline" key={s.id}>
                    <input type="checkbox" checked={answers.directSources.includes(s.label)}
                      onChange={(e) => set({
                        directSources: e.target.checked
                          ? [...answers.directSources, s.label]
                          : answers.directSources.filter((x) => x !== s.label),
                      })} />
                    {s.label}
                  </label>
                ))}
                <ChipInput id="dsrc" values={answers.directSources.filter((s) => !SOURCE_OPTIONS.some((o) => o.label === s))}
                  onChange={(custom) => set({ directSources: [...answers.directSources.filter((s) => SOURCE_OPTIONS.some((o) => o.label === s)), ...custom] })}
                  placeholder="other source — press Enter to add" />
              </div>
              <div>
                <span className="fieldlabel collect-label">Indirectly, via:</span>
                <ChipInput id="isrc" values={answers.indirectSources} onChange={(v) => set({ indirectSources: v })}
                  placeholder="e.g. participant lists from National Groups; emergency-contact details provided by the participant; team registrations submitted by a coach — press Enter to add" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Why do you process the data? (purposes &amp; legal basis) <InfoBook topic="purposes" /></h3>
            <SectionNote section="purposes" />
            <p className="hint">Grouped by theme so you can find them faster. Each purpose sits under one legal basis in
              the policy — the pre-set basis follows common ELSA practice; adjust if needed. Double-click a purpose to
              fine-tune its wording (a single click never ticks the box).</p>
            {[...PURPOSE_GROUPS, 'Added / new purposes'].map((group) => {
              const groupPurposes = answers.purposes.filter((p) => {
                const def = purposeDef(p.id);
                // Custom/preset purposes join a matching theme, else "Added / new purposes"
                return def ? def.group === group : groupForCustomPurpose(p.text) === group;
              });
              if (groupPurposes.length === 0) return null;
              return (
                <div key={group} className="purpose-group">
                  <span className="purpose-group-label">
                    {group}
                    {PURPOSE_GROUP_INFO[group] && (
                      <button
                        type="button" className="bulb" aria-expanded={openBulb === `pg:${group}`}
                        title="Directions to think in, with example purposes"
                        onClick={() => setOpenBulb(openBulb === `pg:${group}` ? null : `pg:${group}`)}
                      >
                        💡
                      </button>
                    )}
                  </span>
                  {openBulb === `pg:${group}` && PURPOSE_GROUP_INFO[group] && (
                    <div className="info-box bulb-box" role="note">
                      <p><b>{PURPOSE_GROUP_INFO[group].what}</b></p>
                      <p><b>Example purposes:</b> {PURPOSE_GROUP_INFO[group].examples}</p>
                      <p><b>How to think about it:</b> {PURPOSE_GROUP_INFO[group].applies}</p>
                    </div>
                  )}
                  {groupPurposes.map((p) => {
                    const isCustom = !purposeDef(p.id);
                    return (
                      <div className={`purposeline ${p.enabled ? 'on' : ''}${mk(`purpose:${p.id}`)}`} key={p.id}
                        data-tip={purposeTip(p.id, p.basis)}>
                        <label className="checkline">
                          <input type="checkbox" checked={p.enabled}
                            onChange={(e) => set({
                              purposes: e.target.checked || !isCustom
                                ? answers.purposes.map((x) => x.id === p.id ? { ...x, enabled: e.target.checked } : x)
                                : answers.purposes.filter((x) => x.id !== p.id),
                            })} />
                          <EditableText value={p.text} ariaLabel={`Edit purpose: ${p.text}`}
                            onSave={(v) => set({ purposes: answers.purposes.map((x) => x.id === p.id ? { ...x, text: v } : x) })} />
                        </label>
                        {p.enabled && (
                          <select className="basis-select" value={p.basis} aria-label={`Legal basis for: ${p.text}`}
                            onChange={(e) => set({ purposes: answers.purposes.map((x) => x.id === p.id ? { ...x, basis: e.target.value as typeof p.basis } : x) })}>
                            {LEGAL_BASIS_DEFS.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.label}{!b.annex4LeadIn ? ' (no template wording — will be flagged)' : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <span className="fieldlabel">Add your own purpose</span>
            <ChipInput id="custom-purpose" values={[]}
              onChange={(texts) => {
                const t = texts[texts.length - 1];
                if (!t) return;
                set({ purposes: [...answers.purposes, { id: `c${Date.now()}`, text: t, basis: 'contract', enabled: true }] });
              }}
              placeholder="describe the purpose — press Enter to add" />
          </div>

          <div className="card">
            <h3>Who receives the data — and does it leave the EEA? <InfoBook topic="recipients" /></h3>
            <SectionNote section="recipients" />
            <SectionNote section="transfers" />
            <div className="grid2">
              <div>
                <span className="fieldlabel collect-label">Within ELSA:</span>
                <span className="hint">Your own Board, Team and OC are part of the controller — they are never listed
                  as recipients (Handbook Ch. 4.2). List only other ELSA entities that actually receive data.</span>
                {INTERNAL_RECIPIENT_OPTIONS.map((r) => {
                  const blockedReason = controllerMatchReason(r.label);
                  return (
                    <div key={r.id}>
                      <label className={`checkline${blockedReason ? ' blocked' : ''}${mk(`ri:${r.label}`)}`}
                        title={blockedReason ?? undefined}
                        data-tip={blockedReason ? undefined : recipTip('ri', r.label)}
                        onClick={() => { if (blockedReason) setRecipientError(blockedReason); }}>
                        <input type="checkbox" disabled={!!blockedReason}
                          checked={!blockedReason && answers.recipientsInternal.includes(r.label)}
                          onChange={(e) => set({
                            recipientsInternal: e.target.checked
                              ? [...answers.recipientsInternal, r.label]
                              : answers.recipientsInternal.filter((x) => x !== r.label),
                          })} />
                        {r.label}
                      </label>
                      {r.hint && <span className="hint areas-hint">{r.hint}</span>}
                    </div>
                  );
                })}
                <ChipInput id="ri-custom"
                  values={answers.recipientsInternal.filter((x) => !INTERNAL_RECIPIENT_OPTIONS.some((o) => o.label === x))}
                  onChange={(custom) => set({ recipientsInternal: [...answers.recipientsInternal.filter((x) => INTERNAL_RECIPIENT_OPTIONS.some((o) => o.label === x)), ...custom] })}
                  placeholder="other ELSA recipient — press Enter"
                  validate={controllerMatchReason} />
              </div>
              <div>
                <span className="fieldlabel collect-label">Outside ELSA (third parties):</span>
                {EXTERNAL_RECIPIENT_OPTIONS.map((r) => (
                  <label className={`checkline${mk(`re:${r.label}`)}`} key={r.id}
                    data-tip={recipTip('re', r.label)}>
                    <input type="checkbox" checked={answers.recipientsExternal.includes(r.label)}
                      onChange={(e) => set({
                        recipientsExternal: e.target.checked
                          ? [...answers.recipientsExternal, r.label]
                          : answers.recipientsExternal.filter((x) => x !== r.label),
                      })} />
                    {r.label}
                    {r.defaultOn && <span className="std-badge" title="Standard ELSA infrastructure — pre-ticked; untick if truly not used">standard</span>}
                  </label>
                ))}
                <ChipInput id="re-custom"
                  values={answers.recipientsExternal.filter((x) => !EXTERNAL_RECIPIENT_OPTIONS.some((o) => o.label === x))}
                  onChange={(custom) => set({ recipientsExternal: [...answers.recipientsExternal.filter((x) => EXTERNAL_RECIPIENT_OPTIONS.some((o) => o.label === x)), ...custom] })}
                  placeholder="other third party — press Enter"
                  validate={controllerMatchReason} />
              </div>
            </div>
            {recipientError && <p className="inline-error" role="alert">{recipientError}</p>}
            {answers.usesProcessors && answers.processors.some((p) => p.name.trim()) && (
              <div className="processor-recipients">
                <span className="fieldlabel">Added automatically as recipients (your processors):</span>
                <div className="chips">
                  {answers.processors.filter((p) => p.name.trim()).map((p, i) => (
                    <span className="chip" key={i}>{p.name} — data {p.kind === 'subprocessor' ? 'sub-processor' : 'processor'}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="subpanel eea-panel">
              <span className="fieldlabel collect-label">Does data go outside the EEA, or to an international organisation?</span>
              <p className="hint">With standard ELSA infrastructure (Google/Gmail, JotForm) data typically reaches the
                United States — that is why this is pre-set to “Yes” with the US listed. Untick only if you are sure
                nothing leaves the EEA.</p>
              <div className="radioline">
                <label className="checkline"><input type="radio" name="eea" checked={answers.transfersOutsideEEA === true}
                  onChange={() => set({ transfersOutsideEEA: true })} /> Yes</label>
                <label className="checkline"><input type="radio" name="eea" checked={answers.transfersOutsideEEA === false}
                  onChange={() => set({ transfersOutsideEEA: false })} /> No</label>
              </div>
              {answers.transfersOutsideEEA === true && (
                <>
                  <span className="fieldlabel">Countries outside the EEA:</span>
                  <ChipInput id="tc" values={answers.thirdCountries} onChange={(v) => set({ thirdCountries: v })}
                    placeholder="e.g. The United States of America — press Enter" />
                  <span className="fieldlabel">International organisations:</span>
                  <ChipInput id="io" values={answers.internationalOrgs} onChange={(v) => set({ internationalOrgs: v })}
                    placeholder="e.g. Council of Europe — press Enter" />
                  <label>Contact for copies of the safeguards (SCCs)
                    <input value={answers.sccContactEmail} placeholder={answers.controller.email || 'e-mail address'}
                      onChange={(e) => set({ sccContactEmail: e.target.value })} />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Final details <InfoBook topic="final" /></h3>
            <SectionNote section="general" showAttention />
            <div className="grid2">
              <label>Notice period for policy changes (days, minimum 14)
                <input type="number" min={14} value={answers.noticeDays}
                  onChange={(e) => set({ noticeDays: Math.max(14, Number(e.target.value) || 14) })} />
              </label>
              <label>Policy version
                <input value={answers.version} onChange={(e) => set({ version: e.target.value })} />
              </label>
              <label>Policy date
                <input type="date" value={answers.policyDate} onChange={(e) => set({ policyDate: e.target.value })} />
              </label>
            </div>
            <label className="checkline">
              <input type="checkbox" checked={answers.retentionPeriods.length > 0}
                onChange={(e) => set({
                  retentionPeriods: e.target.checked
                    ? [
                        { label: 'Registration and contact data', period: 'typically up to 2 years after the end of the event' },
                        { label: 'Financial and billing information', period: '10 years from the end of the relevant financial year (accounting and tax obligations)' },
                        { label: 'Records of consent', period: 'until consent is withdrawn; the record of withdrawal is kept as proof of compliance' },
                        { label: 'Communication data', period: 'typically up to 2 years from the last interaction' },
                      ]
                    : [],
                })} />
              Add indicative retention periods (optional good practice from the approved LeCercle policy — the fixed
              retention text always stays; your ROPA remains the authoritative source)
            </label>
            {answers.retentionPeriods.length > 0 && (
              <div className="subpanel">
                {answers.retentionPeriods.map((r, i) => (
                  <div className="processor-row retention-row" key={i}>
                    <input value={r.label} aria-label="Data type"
                      onChange={(e) => set({ retentionPeriods: answers.retentionPeriods.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                    <input className="retention-period" value={r.period} aria-label="Retention period"
                      onChange={(e) => set({ retentionPeriods: answers.retentionPeriods.map((x, j) => j === i ? { ...x, period: e.target.value } : x) })} />
                    <button className="cut" title="Remove row" aria-label="Remove row"
                      onClick={() => set({ retentionPeriods: answers.retentionPeriods.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                ))}
                <button className="ghost-navy" onClick={() => set({ retentionPeriods: [...answers.retentionPeriods, { label: '', period: '' }] })}>
                  + Add row
                </button>
                <p className="hint">Align these with your ROPA’s retention column — the ROPA holds the specific deadlines.</p>
              </div>
            )}
            <label className="checkline">
              <input type="checkbox" checked={answers.minorsInvolved} onChange={(e) => set({ minorsInvolved: e.target.checked })} />
              Persons under 18 may participate (rare — e.g. a summer school with pupils)
            </label>
            <label className="checkline">
              <input type="checkbox" checked={answers.includeNoAutomatedDecisions}
                onChange={(e) => set({ includeNoAutomatedDecisions: e.target.checked })} />
              Include the statement that no automated decision-making takes place (recommended; untick only if you actually
              make automated decisions — then contact dataprotection@elsa.org)
            </label>
          </div>
        </div>

        <aside className="gaps-side" aria-live="polite">
          <div className={`card ${blocking.length === 0 ? 'ok' : 'todo'}`}>
            <h3>{blocking.length === 0 ? '✓ Ready to generate' : `Still needed (${blocking.length})`}</h3>
            {blocking.length > 0 ? (
              <ul className="gaplist">
                {blocking.map((gap) => (
                  <li key={gap.field}><b>{gap.label}</b><span className="hint"> — {gap.why}</span></li>
                ))}
              </ul>
            ) : (
              <p className="hint">All required information is in place. Optional items can still be refined.</p>
            )}
            {gaps.filter((g) => !g.blocking).length > 0 && (
              <>
                <h4>Recommended</h4>
                <ul className="gaplist soft">
                  {gaps.filter((g) => !g.blocking).map((gap) => (
                    <li key={gap.field}>{gap.label}</li>
                  ))}
                </ul>
              </>
            )}
            {blocking.length > 0 && (
              <p className="hint">Can’t obtain some of this information? Contact the International Data Protection team at{' '}
                <a href="mailto:dataprotection@elsa.org">dataprotection@elsa.org</a> — don’t publish an incomplete policy.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="actions">
        <button onClick={onBack}>← Back</button>
        <button className="primary" disabled={blocking.length > 0} onClick={onContinue}>
          Generate the privacy policy →
        </button>
      </div>
    </section>
  );
}
