import type { PolicyBlock } from '../types';

export interface BlockEdits {
  [blockId: string]: { removed?: boolean; bullets?: string[]; text?: string };
}

interface Props {
  blocks: PolicyBlock[];
  edits: BlockEdits;
  setEdits?: (e: BlockEdits) => void;
  editable: boolean;
  showSources: boolean;
}

/**
 * Renders the assembled policy in the exact Annex 4 order.
 * Editable mode: unlocked bullet lists behave like paper — cut (✕), re-order (↑ ↓),
 * rewrite inline; cut items land in a restore tray. Locked blocks show a lock and
 * are untouchable (brief §2.1/§10).
 */
export function PolicyPreview({ blocks, edits, setEdits, editable, showSources }: Props) {
  const patch = (id: string, p: { removed?: boolean; bullets?: string[]; text?: string }) => {
    if (!setEdits) return;
    setEdits({ ...edits, [id]: { ...edits[id], ...p } });
  };

  return (
    <div className="policy">
      {blocks.map((b) => {
        const e = edits[b.id] ?? {};
        if (e.removed) return null;
        const bullets = e.bullets ?? b.bullets ?? [];
        const text = e.text ?? b.text ?? '';
        const removedTray = (e as { cut?: string[] }).cut;

        const sourceTag = showSources && (
          <span className="source-tag">
            {b.locked ? '🔒 fixed · ' : '✎ editable · '}{b.source}
            {b.deviation ? ` · adapted: ${b.deviation}` : ''}
          </span>
        );

        switch (b.kind) {
          case 'notice':
            return <div className="policy-notice" key={b.id}><p>{text}</p>{sourceTag}</div>;
          case 'title':
            return <div key={b.id}><h1 className="policy-title">{text}</h1>{sourceTag}</div>;
          case 'heading1':
            return (
              <div key={b.id} className="policy-h-wrap">
                {editable && !b.locked && b.id === 'det-h' ? (
                  <input
                    className="policy-h1-input" value={text} aria-label="Detailed section heading"
                    onChange={(ev) => patch(b.id, { text: ev.target.value })}
                  />
                ) : <h2 className="policy-h1">{text}</h2>}
                {sourceTag}
              </div>
            );
          case 'heading2':
            return <div key={b.id} className="policy-h-wrap"><h3 className="policy-h2">{text}</h3>{sourceTag}</div>;
          case 'heading3':
            return <div key={b.id} className="policy-h-wrap"><h4 className="policy-h3">{text}</h4>{sourceTag}</div>;
          case 'bullets': {
            if (!editable || b.locked) {
              return (
                <div key={b.id}>
                  <ul className="policy-ul">{bullets.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  {sourceTag}
                </div>
              );
            }
            return (
              <div key={b.id} className="editable-list">
                <ul className="policy-ul">
                  {bullets.map((t, i) => (
                    <li key={i} className="edit-li">
                      <textarea
                        rows={Math.max(1, Math.ceil(t.length / 90))}
                        value={t} aria-label={`Edit item ${i + 1}`}
                        onChange={(ev) => patch(b.id, { bullets: bullets.map((x, j) => j === i ? ev.target.value : x) })}
                      />
                      <span className="li-tools">
                        <button title="Move up" aria-label="Move up" disabled={i === 0}
                          onClick={() => {
                            const next = [...bullets];
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            patch(b.id, { bullets: next });
                          }}>↑</button>
                        <button title="Move down" aria-label="Move down" disabled={i === bullets.length - 1}
                          onClick={() => {
                            const next = [...bullets];
                            [next[i], next[i + 1]] = [next[i + 1], next[i]];
                            patch(b.id, { bullets: next });
                          }}>↓</button>
                        <button title="Cut from the policy" aria-label="Cut from the policy" className="cut"
                          onClick={() => {
                            const next = bullets.filter((_, j) => j !== i);
                            const cut = [...(removedTray ?? []), bullets[i]];
                            setEdits!({ ...edits, [b.id]: { ...e, bullets: next, cut } as BlockEdits[string] });
                          }}>✕</button>
                      </span>
                    </li>
                  ))}
                </ul>
                {removedTray && removedTray.length > 0 && (
                  <div className="cut-tray">
                    <span className="hint">Cut:</span>
                    {removedTray.map((t, i) => (
                      <button key={i} className="chip restore" title="Restore"
                        onClick={() => {
                          const cut = removedTray.filter((_, j) => j !== i);
                          setEdits!({ ...edits, [b.id]: { ...e, bullets: [...bullets, t], cut } as BlockEdits[string] });
                        }}>
                        {t.length > 48 ? t.slice(0, 48) + '…' : t} ↩
                      </button>
                    ))}
                  </div>
                )}
                {sourceTag}
              </div>
            );
          }
          default: {
            const removable = editable && !b.locked;
            return (
              <div key={b.id} className={removable ? 'removable-p' : undefined}>
                <p className="policy-p">{text}
                  {removable && (
                    <button className="cut inline" title="Remove this optional paragraph" aria-label="Remove paragraph"
                      onClick={() => patch(b.id, { removed: true })}>✕</button>
                  )}
                </p>
                {sourceTag}
              </div>
            );
          }
        }
      })}
    </div>
  );
}
