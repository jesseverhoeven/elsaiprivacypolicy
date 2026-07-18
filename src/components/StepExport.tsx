import { useState } from 'react';
import type { Answers, PolicyBlock } from '../types';
import { buildAdvice } from '../logic/gaps';
import { copyForGoogleDocs } from '../export/clipboard';

interface Props {
  answers: Answers;
  finalBlocks: PolicyBlock[];
  onBack: () => void;
  onStartOver: () => void;
}

export function StepExport({ answers, finalBlocks, onBack, onStartOver }: Props) {
  const [copied, setCopied] = useState(false);
  const advice = buildAdvice(answers);
  const contact = advice.filter((a) => a.level === 'contact');
  const actions = advice.filter((a) => a.level === 'action');
  const infos = advice.filter((a) => a.level === 'info');
  // File name matches the event name (user decision 2026-07-10)
  const filename = `Privacy Policy - ${answers.activityTitle || 'ELSA event'}`;
  const docxContact = {
    controllerName: `ELSA ${answers.controller.name}`.trim(),
    email: answers.controller.email,
    phone: answers.controller.phone,
  };

  return (
    <section className="step">
      <h2>Step 5 · Download your privacy policy</h2>

      {/* Two outputs only: the Word file (which carries the full layout — logo on
          every page, page numbers, justified legal-basis table) and a rich-text
          copy for pasting elsewhere. A PDF is just Word → Save as PDF, so there is
          no separate PDF button (user request 2026-07-18). */}
      <div className="export-grid two">
        <div className="card">
          <h3>Word (.docx)</h3>
          <p className="hint">The complete policy with the ELSA logo, page numbers and footer on every page. Opens in
            Microsoft Word or Google Docs (drag the file into Google Drive and open it). <b>For a PDF</b>, open it and
            choose <i>Save / Download as PDF</i> — that keeps the exact layout.</p>
          <button className="primary" onClick={() => {
            void import('../export/docxExport').then(({ exportDocx }) => exportDocx(finalBlocks, `${filename}.docx`, docxContact));
          }}>Download Word</button>
        </div>
        <div className="card">
          <h3>Copy (text &amp; layout)</h3>
          <p className="hint">Copies the formatted policy so you can paste it (Ctrl/Cmd+V) straight into Google Docs,
            an e-mail or any editor. Formatting, ELSA colours and the contact line are kept.</p>
          <button className="primary" onClick={() => {
            void copyForGoogleDocs(finalBlocks, docxContact).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
          }}>
            {copied ? '✓ Copied' : 'Copy text & layout'}
          </button>
          <p className="hint note">Note: a paste can’t add page numbers or repeat the logo in the top corner of every
            page (those are page settings, not text). For the full layout — logo on every page and page numbers —
            use the <b>Word</b> file instead (in Google Docs, add them via <i>Insert → Header</i> and
            <i> Insert → Page numbers</i> if you paste).</p>
        </div>
      </div>

      {(contact.length > 0 || actions.length > 0) && (
        <div className="card advice-important">
          <h3>Before you publish</h3>
          {contact.map((a, i) => (
            <div className="advice contact" key={`c${i}`}>
              <b>{a.title}.</b> {a.body}
            </div>
          ))}
          {actions.map((a, i) => (
            <div className="advice action" key={`a${i}`}>
              <b>{a.title}.</b> {a.body}
            </div>
          ))}
        </div>
      )}

      {infos.length > 0 && (
        <div className="card">
          <h3>Good to know</h3>
          {infos.map((a, i) => (
            <div className="advice" key={i}>
              <b>{a.title}.</b> {a.body}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <p className="hint">
          Every generated policy is a draft. Questions or
          doubts? The International Data Protection team is happy to help at{' '}
          <a href="mailto:dataprotection@elsa.org">dataprotection@elsa.org</a>. Nothing you entered was sent or stored
          anywhere — refreshing this page clears everything.
        </p>
      </div>

      <div className="actions">
        <button onClick={onBack}>← Back to editing</button>
        <button onClick={onStartOver}>Start a new policy</button>
      </div>
    </section>
  );
}
