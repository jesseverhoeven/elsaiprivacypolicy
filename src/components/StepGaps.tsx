import { useMemo } from 'react';
import type { Answers } from '../types';
import {
  DATA_SUBJECT_OPTIONS, DATA_CATEGORY_DEFS, SOURCE_OPTIONS,
  INTERNAL_RECIPIENT_OPTIONS, EXTERNAL_RECIPIENT_OPTIONS,
  LEGAL_BASIS_DEFS, CONSENT_BANNER_CHECKLIST,
} from '../data/picklists';
import { SUPERVISORY_AUTHORITIES } from '../data/supervisoryAuthorities';
import { findGaps, specialCategoriesSelected } from '../logic/gaps';
import type { AnalysisResult } from '../logic/analyze';

interface Props {
  answers: Answers;
  setAnswers: (a: Answers) => void;
  analysis: AnalysisResult | null;
  onBack: () => void;
  onContinue: () => void;
}

function ChipInput({ values, onChange, placeholder, id }: {
  values: string[]; onChange: (v: string[]) => void; placeholder: string; id: string;
}) {
  return (
    <div className="chipinput">
      <div className="chips">
        {values.map((v, i) => (
          <span className="chip" key={i}>
            {v}
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
            onChange([...values, t.value.trim()]);
            t.value = '';
          }
        }}
      />
    </div>
  );
}

export function StepGaps({ answers, setAnswers, analysis, onBack, onContinue }: Props) {
  const gaps = useMemo(() => findGaps(answers), [answers]);
  const blocking = gaps.filter((g) => g.blocking);
  const special = specialCategoriesSelected(answers);
  const set = (patch: Partial<Answers>) => setAnswers({ ...answers, ...patch });

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

  return (
    <section className="step">
      <h2>Step 2 · Review what was found, add what’s missing</h2>
      {detected.length > 0 && (
        <p className="lead">From your information the tool recognised: {detected.join(' · ')}. Everything below is a
          suggestion — please review each field; the tool proposes, you decide.</p>
      )}

      <div className="gaps-layout">
        <div className="gaps-form">

          <div className="card">
            <h3>The event &amp; your ELSA group</h3>
            <div className="grid2">
              <label>Event / processing activity
                <input value={answers.activityTitle} onChange={(e) => set({ activityTitle: e.target.value })}
                  placeholder="e.g. the National Council Meeting 2026" />
              </label>
              <label>Whom is the policy for?
                <select value={answers.audience} onChange={(e) => set({ audience: e.target.value as Answers['audience'] })}>
                  <option value="participants">Event participants / guests (non-members included)</option>
                  <option value="volunteers">ELSA officers / volunteers</option>
                </select>
              </label>
              <label>ELSA group name (controller)
                <input value={answers.controller.name} onChange={(e) => set({ controller: { ...answers.controller, name: e.target.value } })}
                  placeholder="e.g. The Netherlands, Leuven…" />
              </label>
              <label>Country
                <select value={answers.controllerCountry} onChange={(e) => set({ controllerCountry: e.target.value })}>
                  <option value="">— choose —</option>
                  {SUPERVISORY_AUTHORITIES.map((s) => <option key={s.iso} value={s.iso}>{s.country}</option>)}
                </select>
              </label>
              <label>Address
                <input value={answers.controller.address} onChange={(e) => set({ controller: { ...answers.controller, address: e.target.value } })}
                  placeholder="Street, City, Country" />
              </label>
              <label>E-mail
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
            <label className="checkline">
              <input type="checkbox" checked={answers.controllerKind === 'joint'}
                onChange={(e) => set({ controllerKind: e.target.checked ? 'joint' : 'controller' })} />
              We organise together with another group / an Organising Committee (joint controllers)
            </label>
            {answers.controllerKind === 'joint' && (
              <div className="grid2 subpanel">
                <label>Joint controller name
                  <input value={answers.jointController.name} onChange={(e) => set({ jointController: { ...answers.jointController, name: e.target.value } })}
                    placeholder="e.g. ELSA Ghent / OC of the NCM" />
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

          <div className="card">
            <h3>Whose data do you process?</h3>
            <div className="checkgrid">
              {DATA_SUBJECT_OPTIONS.map((d) => (
                <label className="checkline" key={d.id}>
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
            <label>Other
              <input value={answers.dataSubjectsOther} onChange={(e) => set({ dataSubjectsOther: e.target.value })}
                placeholder="anyone else?" />
            </label>
          </div>

          <div className="card">
            <h3>Which personal data do you collect?</h3>
            <p className="hint">Tick the categories and adjust the exact data items — they appear as bullet points in the policy.</p>
            {answers.dataCategories.map((c) => {
              const def = DATA_CATEGORY_DEFS.find((d) => d.id === c.id)!;
              return (
                <div className={`catline ${c.enabled ? 'on' : ''}`} key={c.id}>
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
          </div>

          {special.length > 0 && (
            <div className="card art9">
              <h3>⚠ Sensitive data safeguard (Art. 9 GDPR)</h3>
              <p>
                You collect <b>{special.join(' and ')}</b> — a special category of personal data. Under the Handbook
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
                <span className="fieldlabel">Directly, via:</span>
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
                  placeholder="other source — press Enter" />
              </div>
              <div>
                <span className="fieldlabel">Indirectly, via:</span>
                <ChipInput id="isrc" values={answers.indirectSources} onChange={(v) => set({ indirectSources: v })}
                  placeholder="e.g. lists from National Groups — press Enter" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Why do you process the data? (purposes &amp; legal basis)</h3>
            <p className="hint">Each purpose sits under one legal basis in the policy. The pre-set basis follows common
              ELSA practice — adjust if needed.</p>
            {answers.purposes.map((p) => (
              <div className={`purposeline ${p.enabled ? 'on' : ''}`} key={p.id}>
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
            <ChipInput id="custom-purpose"
              values={answers.purposes.filter((p) => p.id.startsWith('c')).map((p) => p.text)}
              onChange={(texts) => {
                const preset = answers.purposes.filter((p) => !p.id.startsWith('c'));
                set({
                  purposes: [
                    ...preset,
                    ...texts.map((t, i) => {
                      const existing = answers.purposes.find((p) => p.id.startsWith('c') && p.text === t);
                      return existing ?? { id: `c${Date.now()}-${i}`, text: t, basis: 'contract' as const, enabled: true };
                    }),
                  ],
                });
              }}
              placeholder="add your own purpose — press Enter" />
          </div>

          <div className="card">
            <h3>Who receives the data?</h3>
            <div className="grid2">
              <div>
                <span className="fieldlabel">Within ELSA:</span>
                {INTERNAL_RECIPIENT_OPTIONS.map((r) => (
                  <label className="checkline" key={r.id}>
                    <input type="checkbox" checked={answers.recipientsInternal.includes(r.label)}
                      onChange={(e) => set({
                        recipientsInternal: e.target.checked
                          ? [...answers.recipientsInternal, r.label]
                          : answers.recipientsInternal.filter((x) => x !== r.label),
                      })} />
                    {r.label}
                  </label>
                ))}
              </div>
              <div>
                <span className="fieldlabel">Outside ELSA (third parties):</span>
                {EXTERNAL_RECIPIENT_OPTIONS.map((r) => (
                  <label className="checkline" key={r.id}>
                    <input type="checkbox" checked={answers.recipientsExternal.includes(r.label)}
                      onChange={(e) => set({
                        recipientsExternal: e.target.checked
                          ? [...answers.recipientsExternal, r.label]
                          : answers.recipientsExternal.filter((x) => x !== r.label),
                      })} />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <p className="hint">Your own board/team and the joint controller’s OC don’t need to be listed — they are the
              controllers themselves (Handbook Ch. 4.2).</p>
          </div>

          <div className="card">
            <h3>Does data leave the EEA, or go to international organisations?</h3>
            <div className="radioline">
              <label className="checkline"><input type="radio" name="eea" checked={answers.transfersOutsideEEA === true}
                onChange={() => set({ transfersOutsideEEA: true })} /> Yes</label>
              <label className="checkline"><input type="radio" name="eea" checked={answers.transfersOutsideEEA === false}
                onChange={() => set({ transfersOutsideEEA: false })} /> No</label>
            </div>
            {answers.transfersOutsideEEA === true && (
              <div className="subpanel">
                <span className="fieldlabel">Countries outside the EEA:</span>
                <ChipInput id="tc" values={answers.thirdCountries} onChange={(v) => set({ thirdCountries: v })}
                  placeholder="e.g. United States — press Enter" />
                <span className="fieldlabel">International organisations:</span>
                <ChipInput id="io" values={answers.internationalOrgs} onChange={(v) => set({ internationalOrgs: v })}
                  placeholder="e.g. Council of Europe — press Enter" />
                <label>Contact for copies of the safeguards (SCCs)
                  <input value={answers.sccContactEmail} placeholder={answers.controller.email || 'e-mail address'}
                    onChange={(e) => set({ sccContactEmail: e.target.value })} />
                </label>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Final details</h3>
            <div className="grid2">
              <label>Notice period for policy changes (days)
                <input type="number" min={1} value={answers.noticeDays}
                  onChange={(e) => set({ noticeDays: Math.max(1, Number(e.target.value) || 7) })} />
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
