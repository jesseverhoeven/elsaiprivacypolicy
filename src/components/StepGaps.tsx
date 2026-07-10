import { useMemo, useState } from 'react';
import type { Answers, ProcessorEntry } from '../types';
import {
  DATA_SUBJECT_OPTIONS, DATA_CATEGORY_DEFS, SOURCE_OPTIONS,
  INTERNAL_RECIPIENT_OPTIONS, EXTERNAL_RECIPIENT_OPTIONS,
  LEGAL_BASIS_DEFS, CONSENT_BANNER_CHECKLIST, PURPOSE_GROUPS, PURPOSE_SUGGESTIONS,
  ELSA_INTERNATIONAL_CONTACT,
} from '../data/picklists';
import { SUPERVISORY_AUTHORITIES } from '../data/supervisoryAuthorities';
import { presetById } from '../data/presets';
import { findGaps, specialCategoriesSelected } from '../logic/gaps';
import type { AnalysisResult } from '../logic/analyze';

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
  const preset = presetById(answers.presetId);

  /** Orange marking for values pre-filled from the chosen preset (approved past policy). */
  const mk = (key: string) => (presetMarks.has(key) ? ' from-preset' : '');

  /** Handbook Ch. 4.2: the controllers themselves (incl. their Board/Team/OC) are never listed as recipients. */
  function controllerMatchReason(label: string): string | null {
    const l = label.toLowerCase();
    const names = [answers.controller.name, answers.jointController.name].filter((n) => n.trim().length > 2);
    for (const n of names) {
      if (l.includes(n.toLowerCase())) {
        return `“${label}” matches the (joint) controller “${n}” — controllers themselves are not listed as recipients (Handbook Ch. 4.2).`;
      }
    }
    if (answers.controllerKind === 'joint' && /organising committee|organizing committee|\boc\b/i.test(answers.jointController.name)
      && /organising committee/i.test(label)) {
      return 'Your Organising Committee is a joint controller here — controllers themselves are not listed as recipients (Handbook Ch. 4.2).';
    }
    return null;
  }

  const detected = analysis
    ? [
        analysis.groupNames.length > 0 && `ELSA group “${analysis.groupNames[0]}”`,
        analysis.activityTitleGuess && `event “${analysis.activityTitleGuess}”`,
        analysis.dataCategoryIds.length > 0 && `${analysis.dataCategoryIds.length} data categories`,
        analysis.sourceIds.length > 0 && `${analysis.sourceIds.length} data sources`,
        analysis.externalRecipientIds.length > 0 && `${analysis.externalRecipientIds.length} third-party recipients`,
        analysis.art9Signals.length > 0 && `⚠ possible sensitive (Art. 9) data`,
      ].filter(Boolean) as string[]
    : [];

  const customCategories = answers.dataCategories.filter((c) => c.id.startsWith('custom:'));
  const standardCategories = answers.dataCategories.filter((c) => !c.id.startsWith('custom:'));

  return (
    <section className="step">
      <h2>Step 3 · Review what was found, add what’s missing</h2>
      {detected.length > 0 && (
        <p className="lead">From your information the tool recognised: {detected.join(' · ')}. Everything below is a
          suggestion — please review each field; the tool proposes, you decide.
          {preset && <> Values marked <span className="from-preset-example">orange</span> come from the approved {preset.name} policy.</>}
        </p>
      )}

      {preset && (
        <div className="card attention" role="note">
          <h3>⚠ Attention — you started from {preset.name}</h3>
          {answers.changeNotes.trim() && (
            <p><b>You noted these changes:</b> {answers.changeNotes}</p>
          )}
          <ul>
            {preset.attentionPoints.map((pt, i) => <li key={i}>{pt}</li>)}
          </ul>
        </div>
      )}

      <div className="gaps-layout">
        <div className="gaps-form">

          <div className="card">
            <h3>The event &amp; the controller</h3>
            <div className="grid2">
              <label className={mk('field:activityTitle')}>Event / processing activity
                <input value={answers.activityTitle} onChange={(e) => set({ activityTitle: e.target.value })}
                  placeholder="e.g. the National Council Meeting 2026" />
              </label>
              <label>Whom is the policy mainly for?
                <select value={answers.audience} onChange={(e) => set({ audience: e.target.value as Answers['audience'] })}>
                  <option value="participants">Event participants / guests (incl. ELSA members attending)</option>
                  <option value="volunteers">ELSA officers / volunteers being recruited or managed</option>
                </select>
                <span className="hint">This only affects the phrasing of a few template sentences (“participating in…” vs
                  “volunteering with…”). ELSA members attending an event count as participants.</span>
              </label>
            </div>

            <div className="role-block controller-block">
              <span className="role-tag controller-tag">Controller</span>
              <div className="quickfill">
                <button
                  type="button" className="ghost-navy"
                  onClick={() => set({
                    controller: { ...ELSA_INTERNATIONAL_CONTACT },
                    controllerCountry: 'BE',
                  })}
                >
                  Quick-fill: ELSA International
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
                  <label>Purposes for which YOUR group acts alone (optional)
                    <input value={answers.soleControllerPurposes} onChange={(e) => set({ soleControllerPurposes: e.target.value })}
                      placeholder="e.g. managing its own members’ registrations" />
                  </label>
                </div>
              )}
            </div>

            <div className="role-block processor-block">
              <span className="role-tag processor-tag">Processor</span>
              <label className="checkline">
                <input type="checkbox" checked={answers.usesProcessors}
                  onChange={(e) => set({ usesProcessors: e.target.checked })} />
                We use a <b>processor / sub-processor</b> (a party that processes data <i>on our instructions</i> — e.g. a
                registration platform, mailing service or payment provider; not a controller)
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
            <h3>Whose data do you process? (data subjects)</h3>
            <div className="checkgrid">
              {DATA_SUBJECT_OPTIONS.map((d) => (
                <label className={`checkline${mk(`ds:${d.label}`)}`} key={d.id}>
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
            <h3>Which personal data do you collect?</h3>
            <p className="hint">Tick the categories and adjust the exact data items — they appear as bullet points in the policy.</p>
            {standardCategories.map((c) => {
              const def = DATA_CATEGORY_DEFS.find((d) => d.id === c.id)!;
              return (
                <div className={`catline ${c.enabled ? 'on' : ''}${mk(`cat:${c.id}`)}`} key={c.id}>
                  <label className="checkline">
                    <input type="checkbox" checked={c.enabled}
                      onChange={(e) => set({
                        dataCategories: answers.dataCategories.map((x) => x.id === c.id ? { ...x, enabled: e.target.checked } : x),
                      })} />
                    <b>{def.label}</b>
                    {def.special && <span className="special-badge" title="Special category — Art. 9 GDPR">Art. 9 — sensitive</span>}
                  </label>
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
              <div className={`catline on${mk(`cat:${c.id}`)}`} key={c.id}>
                <label className="checkline">
                  <input type="checkbox" checked={c.enabled}
                    onChange={(e) => set({
                      dataCategories: e.target.checked
                        ? answers.dataCategories.map((x) => x.id === c.id ? { ...x, enabled: true } : x)
                        : answers.dataCategories.filter((x) => x.id !== c.id),
                    })} />
                  <b>{c.customLabel}</b>
                  <span className="custom-badge">own category</span>
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
              {!answers.purposes.some((p) => p.enabled && p.basis === 'consent') && (
                <p className="hint">Also list at least one purpose under the legal basis “Consent” below (e.g. “To provide
                  meals adapted to dietary restrictions and allergies”).</p>
              )}
            </div>
          )}

          <div className="card">
            <h3>How do you collect the data?</h3>
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
                  placeholder="e.g. lists from National Groups — press Enter to add" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Why do you process the data? (purposes &amp; legal basis)</h3>
            <p className="hint">Grouped by theme so you can find them faster. Each purpose sits under one legal basis in
              the policy — the pre-set basis follows common ELSA practice; adjust if needed.</p>
            {PURPOSE_GROUPS.map((group) => {
              const groupPurposes = answers.purposes.filter((p) => {
                const def = PURPOSE_SUGGESTIONS.find((s) => s.text === p.text);
                return def ? def.group === group : false;
              });
              if (groupPurposes.length === 0) return null;
              return (
                <div key={group} className="purpose-group">
                  <span className="purpose-group-label">{group}</span>
                  {groupPurposes.map((p) => (
                    <div className={`purposeline ${p.enabled ? 'on' : ''}${mk(`purpose:${p.id}`)}`} key={p.id}>
                      <label className="checkline">
                        <input type="checkbox" checked={p.enabled}
                          onChange={(e) => set({ purposes: answers.purposes.map((x) => x.id === p.id ? { ...x, enabled: e.target.checked } : x) })} />
                        {p.text}
                      </label>
                      {p.enabled && (
                        <select value={p.basis} aria-label={`Legal basis for: ${p.text}`}
                          onChange={(e) => set({ purposes: answers.purposes.map((x) => x.id === p.id ? { ...x, basis: e.target.value as typeof p.basis } : x) })}>
                          {LEGAL_BASIS_DEFS.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.label}{!b.annex4LeadIn ? ' (no template wording — will be flagged)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            {answers.purposes.filter((p) => !PURPOSE_SUGGESTIONS.some((s) => s.text === p.text)).map((p) => (
              <div className={`purposeline on${mk(`purpose:${p.id}`)}`} key={p.id}>
                <label className="checkline">
                  <input type="checkbox" checked={p.enabled}
                    onChange={(e) => set({
                      purposes: e.target.checked
                        ? answers.purposes.map((x) => x.id === p.id ? { ...x, enabled: true } : x)
                        : answers.purposes.filter((x) => x.id !== p.id),
                    })} />
                  {p.text}
                </label>
                <select value={p.basis} aria-label={`Legal basis for: ${p.text}`}
                  onChange={(e) => set({ purposes: answers.purposes.map((x) => x.id === p.id ? { ...x, basis: e.target.value as typeof p.basis } : x) })}>
                  {LEGAL_BASIS_DEFS.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}{!b.annex4LeadIn ? ' (no template wording — will be flagged)' : ''}</option>
                  ))}
                </select>
              </div>
            ))}
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
            <h3>Who receives the data — and does it leave the EEA?</h3>
            <div className="grid2">
              <div>
                <span className="fieldlabel collect-label">Within ELSA:</span>
                {INTERNAL_RECIPIENT_OPTIONS.map((r) => {
                  const blockedReason = controllerMatchReason(r.label);
                  return (
                    <div key={r.id}>
                      <label className={`checkline${blockedReason ? ' blocked' : ''}${mk(`ri:${r.label}`)}`}
                        title={blockedReason ?? undefined}
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
                  <label className={`checkline${mk(`re:${r.label}`)}`} key={r.id}>
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
            <p className="hint">The (joint) controllers themselves — including their own Board, Team or OC — are never
              listed as recipients (Handbook Ch. 4.2); matching options are blocked automatically.</p>

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
            <h3>Final details</h3>
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
