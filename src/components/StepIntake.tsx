import { useRef, useState } from 'react';
import type { IntakeState } from '../state';

interface Props {
  intake: IntakeState;
  setIntake: (i: IntakeState) => void;
  onAnalyse: (combinedText: string, jotformLink: string) => void;
  onBack: () => void;
  presetName?: string;
}

export function StepIntake({ intake, setIntake, onAnalyse, onBack, presetName }: Props) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { files, jotformLink, pasted, manual } = intake;

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setBusy(true);
    setUploadError('');
    const parsed = [...files];
    try {
      const { extractFileText } = await import('../logic/extractFiles');
      for (const file of Array.from(list)) {
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

  const combined = [files.map((f) => f.text).join('\n\n'), pasted, manual, jotformLink].join('\n\n');
  const hasInput = combined.trim().length > 0 || !!presetName;

  return (
    <section className="step">
      <h2>Step 2 · Tell the tool everything about your event</h2>
      <p className="lead">
        {presetName
          ? <>You started from <b>{presetName}</b> — its approved policy is already pre-filled. Add anything new here (this year’s form, new documents, changes) and the scan merges it in. </>
          : <>Add as much information as you can — the event description, the JotForm (or other form) you use, what you ask participants, who helps organise. </>}
        The tool scans everything <b>on your device only</b> (nothing is uploaded anywhere).
      </p>

      <div className="intake-grid">
        <div className="card">
          <h3><span className="badge">A</span> Upload documents</h3>
          <p className="hint">PDF, Word (.docx) or text — e.g. a JotForm PDF export, an event one-pager, or a document
            downloaded from Google Drive (File → Download → PDF or Word).</p>
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
          <p className="hint">Paste the link to your JotForm for reference, and paste the form’s content (questions and
            options) below. Tip: in JotForm you can copy all questions from the form editor, or export the form as PDF and
            upload it under A — browsers do not allow this tool to read jotform.com pages directly.</p>
          <label className="fieldlabel" htmlFor="jotform-link">JotForm link (optional)</label>
          <input
            id="jotform-link" type="url" placeholder="https://form.jotform.com/…"
            value={jotformLink} onChange={(e) => setIntake({ ...intake, jotformLink: e.target.value })}
          />
          <label className="fieldlabel" htmlFor="jotform-paste">Pasted form content</label>
          <textarea
            id="jotform-paste" rows={7}
            placeholder={'e.g.\nFull name · E-mail address · Phone\nDietary restrictions or allergies?\nDo you need accommodation? Which nights?\nEmergency contact name and number…'}
            value={pasted} onChange={(e) => setIntake({ ...intake, pasted: e.target.value })}
          />
        </div>

        <div className="card">
          <h3><span className="badge">C</span> Describe it in your own words</h3>
          <p className="hint">Anything else: what the event is, who attends, which tools you use (Google Forms, Zoom…),
            who you share lists with (hotel, caterer, ELSA International…), payments, photos, countries involved.</p>
          <label className="fieldlabel" htmlFor="manual-text">Event information</label>
          <textarea
            id="manual-text" rows={11}
            placeholder={'e.g. ELSA Leuven organises a Summer Law School in July for 40 international participants. We register them via JotForm (name, email, meal preferences incl. allergies, accommodation). We share the rooming list with the hostel and the meal list with the caterer, use Google Drive and Zoom, and post photos on Instagram…'}
            value={manual} onChange={(e) => setIntake({ ...intake, manual: e.target.value })}
          />
        </div>
      </div>

      <div className="actions">
        <button onClick={onBack}>← Back</button>
        <button
          className="primary" disabled={!hasInput || busy}
          onClick={() => onAnalyse(combined, jotformLink)}
        >
          Scan my information →
        </button>
        {!hasInput && <span className="hint">Add at least one document or some text to continue.</span>}
      </div>
    </section>
  );
}
