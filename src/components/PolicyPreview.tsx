import type { PolicyBlock } from '../types';
import logoUrl from '../assets/elsa-logo.png';

/** Stable anchor id for a TOC entry / heading text (shared by TOC links and headings). */
export function anchorFor(text: string): string {
  return 'sec-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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
      <img src={logoUrl} alt="ELSA — The European Law Students’ Association" className="policy-logo" />
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
          case 'toc':
            return (
              <div key={b.id} className="policy-toc">
                <h3 className="policy-h2">Contents</h3>
                <ul>
                  {(b.entries ?? []).map((e, i) => (
                    <li key={i} className={/^\d/.test(e) || e === 'Summary' || e === 'More details' ? 'toc-top' : 'toc-sub'}>
                      <a href={`#${anchorFor(e)}`}>{e}</a>
                    </li>
                  ))}
                </ul>
                {sourceTag}
              </div>
            );
          case 'basisTable':
            return (
              <div key={b.id} className="basis-table-wrap">
                <table className="basis-table">
                  <thead>
                    <tr><th>Legal basis</th><th>Purposes</th></tr>
                  </thead>
                  <tbody>
                    {(b.rows ?? []).map((row, i) => (
                      <tr key={i}>
                        <td>
                          <span className="basis-name">{row.label}</span>
                          <span className="basis-leadtext">{row.lead}</span>
                        </td>
                        <td>
                          <ul>{row.purposes.map((p, j) => <li key={j}>{p}</li>)}</ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editable && <p className="hint">Purposes are edited in the previous step (“Complete &amp; check”).</p>}
                {sourceTag}
              </div>
            );
          case 'notice':
            return <div className="policy-notice" key={b.id}><p>{text}</p>{sourceTag}</div>;
          case 'title':
            return <div key={b.id}><h1 className="policy-title">{text}</h1>{sourceTag}</div>;
          case 'heading1':
            return <div key={b.id} className="policy-h-wrap"><h2 className="policy-h1" id={anchorFor(text)}>{text}</h2>{sourceTag}</div>;
          case 'heading2':
            return <div key={b.id} className="policy-h-wrap"><h3 className="policy-h2" id={anchorFor(text)}>{text}</h3>{sourceTag}</div>;
          case 'heading3':
            return <div key={b.id} className="policy-h-wrap"><h4 className="policy-h3" id={anchorFor(text)}>{text}</h4>{sourceTag}</div>;
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
