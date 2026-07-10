import { useState } from 'react';
import { PRESET_EVENTS, presetById } from '../data/presets';

interface Props {
  onChoose: (presetId: string | null, changeNotes: string) => void;
}

/**
 * Step 1 — start from a recognised (previously approved) ELSA event, or a new one.
 * Choosing a preset pre-fills all variable information from that approved policy;
 * everything stays reviewable and the preset-derived values are marked in orange.
 * New approved policies are added to src/data/presets.ts via git commit — no database.
 */
export function StepChooseEvent({ onChoose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const preset = presetById(selected);

  return (
    <section className="step">
      <h2>Step 1 · What are you creating a privacy policy for?</h2>
      <p className="lead">
        Start from a recognised ELSA event — its previously <b>approved</b> privacy policy pre-fills everything — or
        start fresh. Either way, you review and adapt every detail in the next steps.
      </p>

      <div className="event-grid">
        <button
          className={`event-card new ${selected === null ? 'chosen' : ''}`}
          onClick={() => setSelected(null)}
        >
          <span className="event-name">＋ New event</span>
          <span className="hint">Start from scratch — describe your event in the next step and the tool pre-fills what it recognises.</span>
        </button>
        {PRESET_EVENTS.map((p) => (
          <button
            key={p.id}
            className={`event-card ${selected === p.id ? 'chosen' : ''}`}
            onClick={() => setSelected(p.id)}
          >
            <span className="event-name">{p.name}</span>
            <span className="hint">{p.description}</span>
            <span className="event-source">Based on: {p.sourcePolicy}</span>
          </button>
        ))}
      </div>

      {preset && (
        <div className="card preset-diff">
          <h3>Is this edition of {preset.name} any different from the previous one?</h3>
          <p className="hint">
            Think about: a different (joint) controller or Organising Committee, new data being collected, a new
            registration form or payment provider, other recipients, new countries involved. Describe anything that
            changed — the next step will remind you to double-check it.
          </p>
          <textarea
            rows={4}
            value={changeNotes}
            onChange={(e) => setChangeNotes(e.target.value)}
            placeholder="e.g. This year the OC of ELSA Ghent co-organises; we switched from Google Forms to JotForm; a photographer attends…"
            aria-label="What changed compared to the previous edition"
          />
          <div className="attention-list">
            <span className="fieldlabel">Pay extra attention to (from the approved policy):</span>
            <ul className="hint">
              {preset.attentionPoints.map((pt, i) => <li key={i}>{pt}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="actions">
        <button className="primary" onClick={() => onChoose(selected, changeNotes)}>
          {preset ? `Continue with ${preset.name} →` : 'Continue with a new event →'}
        </button>
      </div>
    </section>
  );
}
