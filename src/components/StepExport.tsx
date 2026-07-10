import { useState } from 'react';
import type { Answers, PolicyBlock } from '../types';
import { buildAdvice } from '../logic/gaps';
import { copyForGoogleDocs } from '../export/clipboard';
import { PolicyPreview } from './PolicyPreview';

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

  function printPdf() {
    // The browser uses document.title for the PDF's default file name and the
    // printed page header — it must be the policy name, never the tool's name.
    const original = document.title;
    document.title = filename;
    window.addEventListener('afterprint', () => { document.title = original; }, { once: true });
    window.print();
  }

  return (
    <section className="step">
      <h2>Step 5 · Download your privacy policy</h2>

      <div className="export-grid">
        <div className="card">
          <h3>Word (.docx)</h3>
          <p className="hint">Opens in Microsoft Word — and in Google Docs: drag the file into Google Drive and open it.</p>
          <button className="primary" onClick={() => {
            void import('../export/docxExport').then(({ exportDocx }) => exportDocx(finalBlocks, `${filename}.docx`, docxContact));
          }}>Download Word</button>
        </div>
        <div className="card">
          <h3>PDF</h3>
          <p className="hint">Opens your browser’s print dialog — choose “Save as PDF” as the destination.</p>
          <button className="primary" onClick={printPdf}>Download PDF</button>
        </div>
        <div className="card">
          <h3>Google Docs</h3>
          <p className="hint">Copies the formatted policy — open a new Google Doc and paste (Ctrl/Cmd+V). Formatting and
            ELSA colours are kept.</p>
          <button className="primary" onClick={() => {
            void copyForGoogleDocs(finalBlocks).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
          }}>
            {copied ? '✓ Copied' : 'Copy for Google Docs'}
          </button>
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
          Every generated policy is a draft: have it checked by your Data Protection team before publishing. Questions or
          doubts? The International Data Protection team is happy to help at{' '}
          <a href="mailto:dataprotection@elsa.org">dataprotection@elsa.org</a>. Nothing you entered was sent or stored
          anywhere — refreshing this page clears everything.
        </p>
      </div>

      <div className="actions">
        <button onClick={onBack}>← Back to editing</button>
        <button onClick={onStartOver}>Start a new policy</button>
      </div>

      {/* Print-only rendering of the final policy (PDF export path). The footer with
          the controller's contact details repeats on every printed page (LeCercle layout). */}
      <div className="print-only">
        <div className="print-footer" aria-hidden="true">
          <b>{docxContact.controllerName}</b>&nbsp;&nbsp; e-mail: {docxContact.email}
          {docxContact.phone ? <>&nbsp;&nbsp; tel.: {docxContact.phone}</> : null}
        </div>
        <PolicyPreview blocks={finalBlocks} edits={{}} editable={false} showSources={false} />
      </div>
    </section>
  );
}
