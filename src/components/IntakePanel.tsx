import { useEffect, useRef, useState } from 'react';
import type { IntakeState } from '../state';

interface Props {
  intake: IntakeState;
  setIntake: (i: IntakeState) => void;
  /** 'new' = fresh event (describe everything); 'preset' = comments/changes vs the approved policy. */
  mode: 'new' | 'preset';
  presetName?: string;
}

/**
 * The A/B/C information intake, shown inline inside the step-1 event box.
 * A: upload documents (parsed locally); B: JotForm content; C: free text —
 * for presets, C asks only for remarks/known changes, everything else is
 * walked through in "Complete & check".
 */
export function IntakePanel({ intake, setIntake, mode, presetName }: Props) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { files, pasted, manual } = intake;

  // Dropping a file outside the dropzone must not navigate the browser away
  // (a classic reason uploads "don't work").
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault(); };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    // Snapshot BEFORE any await: a FileList is live and empties the moment the
    // <input> is reset — this was why dialog-chosen files never appeared.
    const chosen = Array.from(list);
    setBusy(true);
    setUploadError('');
    const parsed = [...files];
    try {
      const { extractFileText } = await import('../logic/extractFiles');
      for (const file of chosen) {
        try {
          const text = await extractFileText(file);
          parsed.push({ name: file.name, chars: text.length, text });
        } catch (e) {
          parsed.push({ name: file.name, chars: 0, text: '', error: e instanceof Error ? e.message : String(e) });
        }
      }
    } catch (e) {
      setUploadError(`The file reader could not be loaded (${e instanceof Error ? e.message : String(e)}). ` +
        'Please paste the document’s text into field C instead.');
    } finally {
      setIntake({ ...intake, files: parsed });
      setBusy(false);
    }
  }

  return (
    <div className="intake-grid">
      <div className="card">
        <h3><span className="badge">A</span> Upload documents</h3>
        <p className="hint">PDF, Word (.docx) or text — e.g. a JotForm PDF export, an event one-pager, or a document
          downloaded from Google Drive (File → Download → PDF or Word). Everything is read on your device only.</p>
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        >
          {busy ? 'Reading files…' : 'Drop files here or click to choose'}
        </div>
        <input
          ref={inputRef} type="file" multiple hidden
          accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(e) => { void handleFiles(e.target.files); e.target.value = ''; }}
        />
        {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
        {files.length > 0 && (
          <ul className="filelist">
            {files.map((f, i) => (
              <li key={i} className={f.error ? 'file-error' : 'file-ok'}>
                {f.error ? '⚠' : '✓'} <b>{f.name}</b> {f.error ? `— ${f.error}` : `— ${f.chars.toLocaleString()} characters read`}
                <button className="linkbtn" onClick={() => setIntake({ ...intake, files: files.filter((_, j) => j !== i) })} aria-label={`Remove ${f.name}`}>remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3><span className="badge">B</span> JotForm</h3>
        <p className="hint">Paste the form’s content (questions and options) below. Tip: in JotForm you can copy all
          questions from the form editor, or export the form as PDF and upload it under A — browsers do not allow this
          tool to read jotform.com pages directly.</p>
        <label className="fieldlabel" htmlFor="jotform-paste">Pasted form content</label>
        <textarea
          id="jotform-paste" rows={7}
          placeholder={'e.g.\nFull name · E-mail address · Phone\nDietary restrictions or allergies?\nDo you need accommodation? Which nights?\nEmergency contact name and number…'}
          value={pasted} onChange={(e) => setIntake({ ...intake, pasted: e.target.value })}
        />
      </div>

      <div className="card">
        <h3><span className="badge">C</span> {mode === 'preset' ? 'Comments & known changes' : 'Describe it in your own words'}</h3>
        {mode === 'preset' ? (
          <p className="hint">Any general comments, guidance or remarks — e.g. things you already know changed compared
            to previous {presetName ?? 'event'} editions (different organisers, new tools, new data being collected).
            Don’t worry about who attends or the details here: <b>we walk through everything together in “Complete &amp;
            check”</b> — it’s in good hands.</p>
        ) : (
          <p className="hint">Anything else: what the event is, who attends, which tools you use (Google Forms, Zoom…),
            who you share lists with (hotel, caterer, ELSA International…), payments, photos, countries involved.</p>
        )}
        <label className="fieldlabel" htmlFor="manual-text">{mode === 'preset' ? 'Your remarks (optional)' : 'Event information'}</label>
        <textarea
          id="manual-text" rows={mode === 'preset' ? 6 : 11}
          placeholder={mode === 'preset'
            ? 'e.g. This year the OC of ELSA Ghent co-organises; we switched to a new payment provider; a photographer attends…'
            : 'e.g. ELSA Leuven organises a Summer Law School in July for 40 international participants. We register them via JotForm (name, email, meal preferences incl. allergies, accommodation). We share the rooming list with the hostel and the meal list with the caterer, use Google Drive and Zoom, and post photos on Instagram…'}
          value={manual} onChange={(e) => setIntake({ ...intake, manual: e.target.value })}
        />
      </div>
    </div>
  );
}
