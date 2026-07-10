import { useEffect, useMemo, useState } from 'react';
import type { Answers } from './types';
import { defaultAnswers, mergeAnalysis } from './state';
import { analyzeText, type AnalysisResult } from './logic/analyze';
import { assemblePolicy } from './logic/assemble';
import { LEGAL_DISCLAIMER, REVIEW_NOTICE, TEMPLATE_VERSION } from './data/clauses';
import { StepIntake } from './components/StepIntake';
import { StepGaps } from './components/StepGaps';
import { StepCompose } from './components/StepCompose';
import { StepExport } from './components/StepExport';
import type { BlockEdits } from './components/PolicyPreview';
import './App.css';

const STEPS = ['Your information', 'Complete & check', 'Review & trim', 'Download'] as const;

export default function App() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(defaultAnswers);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [edits, setEdits] = useState<BlockEdits>({});

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const assembled = useMemo(() => assemblePolicy(answers), [answers]);
  const finalBlocks = useMemo(
    () =>
      assembled
        .map((b) => {
          const e = edits[b.id];
          if (!e || b.locked) return b;
          return { ...b, text: e.text ?? b.text, bullets: e.bullets ?? b.bullets, removed: e.removed };
        })
        .filter((b) => !b.removed),
    [assembled, edits],
  );

  function handleAnalyse(text: string, jotformLink: string) {
    const result = analyzeText(text);
    setAnalysis(result);
    setAnswers((a) => mergeAnalysis({ ...a, jotformLink: jotformLink || a.jotformLink }, result));
    setStep(1);
  }

  function saveAnswersToFile() {
    const blob = new Blob([JSON.stringify({ answers, edits }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elsaiprivacypolicy-answers-${answers.policyDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadAnswersFromFile(file: File) {
    try {
      const data = JSON.parse(await file.text()) as { answers: Answers; edits: BlockEdits };
      if (data.answers) {
        setAnswers({ ...defaultAnswers(), ...data.answers });
        setEdits(data.edits ?? {});
        setStep(1);
      }
    } catch {
      alert('That file could not be read as saved answers.');
    }
  }

  return (
    <div className="app">
      <header className="masthead no-print">
        <div className="mast-inner">
          <div>
            <span className="brand">elsa<b>i</b>privacypolicy</span>
            <span className="tagline">Privacy-policy generator for ELSA events — template-true, nothing leaves your browser</span>
          </div>
          <div className="file-actions">
            <button className="ghost" onClick={saveAnswersToFile} title="Save your answers as a file on your own device">
              Save answers
            </button>
            <label className="ghost filebtn">
              Load answers
              <input
                type="file" accept=".json" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadAnswersFromFile(f); e.target.value = ''; }}
              />
            </label>
          </div>
        </div>
        <nav className="stepper" aria-label="Progress">
          {STEPS.map((label, i) => (
            <button
              key={label}
              className={`stepdot ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => { if (i < step) setStep(i); }}
              disabled={i > step}
            >
              <span className="dot">{i + 1}</span> {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="notice-banner no-print" role="note">
        {REVIEW_NOTICE}
        <details className="disclaimer">
          <summary>Legal disclaimer — no liability of the Tool’s creator or ELSA</summary>
          <p>{LEGAL_DISCLAIMER}</p>
        </details>
      </div>

      <main>
        {step === 0 && <StepIntake onAnalyse={handleAnalyse} />}
        {step === 1 && (
          <StepGaps
            answers={answers} setAnswers={setAnswers} analysis={analysis}
            onBack={() => setStep(0)} onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepCompose
            blocks={assembled} edits={edits} setEdits={setEdits}
            onBack={() => setStep(1)} onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepExport
            answers={answers} finalBlocks={finalBlocks}
            onBack={() => setStep(2)}
            onStartOver={() => { setStep(0); setAnswers(defaultAnswers()); setAnalysis(null); setEdits({}); }}
          />
        )}
      </main>

      <footer className="app-footer no-print">
        <p>
          Template set {TEMPLATE_VERSION} · Sources: Annex 4 — Template Privacy Policy &amp; ELSA Data Protection Handbook ·
          No cookies, no analytics, no server — everything runs in your browser ·{' '}
          <a href="mailto:dataprotection@elsa.org">dataprotection@elsa.org</a>
        </p>
        <details className="disclaimer">
          <summary>Legal disclaimer</summary>
          <p>{LEGAL_DISCLAIMER}</p>
        </details>
      </footer>
    </div>
  );
}
