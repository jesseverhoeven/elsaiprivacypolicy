import { useRef, useState } from 'react';

interface Props {
  onAnalyse: (combinedText: string, jotformLink: string) => void;
}

interface ParsedFile { name: string; chars: number; text: string; error?: string }

export function StepIntake({ onAnalyse }: Props) {
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [jotformLink, setJotformLink] = useState('');
  const [pasted, setPasted] = useState('');
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    setBusy(true);
    const { extractFileText } = await import('../logic/extractFiles');
    const parsed: ParsedFile[] = [...files];
    for (const file of Array.from(list)) {
      try {
        const text = await extractFileText(file);
        parsed.push({ name: file.name, chars: text.length, text });
      } catch (e) {
        parsed.push({ name: file.name, chars: 0, text: '', error: e instanceof Error ? e.message : String(e) });
      }
    }
    setFiles(parsed);
    setBusy(false);
  }

  const combined = [files.map((f) => f.text).join('\n\n'), pasted, manual, jotformLink].join('\n\n');
  const hasInput = combined.trim().length > 0;

  return (
    <section className="step">
      <h2>Step 1 · Tell the tool everything about your event</h2>
      <p className="lead">
        Add as much information as you can — the event description, the JotForm (or other form) you use, what you ask
        participants, who helps organise. The tool scans it <b>on your device only</b> (nothing is uploaded anywhere) and
        pre-fills the privacy policy questionnaire.
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
            accept=".pdf,.docx,.txt,.md,.csv"
            onChange={(e) => { void handleFiles(e.target.files); e.target.value = ''; }}
          />
          {files.length > 0 && (
            <ul className="filelist">
              {files.map((f, i) => (
                <li key={i} className={f.error ? 'file-error' : ''}>
                  {f.name} {f.error ? `— ${f.error}` : `— ${f.chars.toLocaleString()} characters read`}
                  <button className="linkbtn" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3><span className="badge">B</span> JotForm</h3>
          <p className="hint">Paste the link to your JotForm for reference, and paste the form’s content (questions and
            options) below. Tip: in JotForm you can copy all questions from the form editor, or export the form as PDF and
            upload it under A — browsers do not allow this tool to read jotform.com pages directly, and this tool makes no
            external requests by design.</p>
          <label className="fieldlabel" htmlFor="jotform-link">JotForm link (optional)</label>
          <input
            id="jotform-link" type="url" placeholder="https://form.jotform.com/…"
            value={jotformLink} onChange={(e) => setJotformLink(e.target.value)}
          />
          <label className="fieldlabel" htmlFor="jotform-paste">Pasted form content</label>
          <textarea
            id="jotform-paste" rows={7}
            placeholder={'e.g.\nFull name · E-mail address · Phone\nDietary restrictions or allergies?\nDo you need accommodation? Which nights?\nEmergency contact name and number…'}
            value={pasted} onChange={(e) => setPasted(e.target.value)}
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
            value={manual} onChange={(e) => setManual(e.target.value)}
          />
        </div>
      </div>

      <div className="actions">
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
