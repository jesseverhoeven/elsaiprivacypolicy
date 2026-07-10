import { useState } from 'react';
import type { PolicyBlock } from '../types';
import { PolicyPreview, type BlockEdits } from './PolicyPreview';

interface Props {
  blocks: PolicyBlock[];
  edits: BlockEdits;
  setEdits: (e: BlockEdits) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function StepCompose({ blocks, edits, setEdits, onBack, onContinue }: Props) {
  const [showSources, setShowSources] = useState(false);

  return (
    <section className="step">
      <h2>Step 4 · Your privacy policy — trim it like paper</h2>
      <p className="lead">
        This is the full policy in the exact ELSA template structure. Lists that came from <b>your</b> answers can be
        rewritten, re-ordered (↑ ↓) or cut (✕) — cut items can be restored. The standardised legal sections are fixed and
        cannot be changed; that protects you.
      </p>
      <label className="checkline toolbar">
        <input type="checkbox" checked={showSources} onChange={(e) => setShowSources(e.target.checked)} />
        Show where each part comes from (Annex 4 / Handbook traceability)
      </label>

      <div className="paper">
        <PolicyPreview blocks={blocks} edits={edits} setEdits={setEdits} editable showSources={showSources} />
      </div>

      <div className="actions">
        <button onClick={onBack}>← Back to the questions</button>
        <button className="primary" onClick={onContinue}>Looks good — download →</button>
      </div>
    </section>
  );
}
