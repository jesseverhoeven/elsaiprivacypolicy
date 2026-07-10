import { useEffect, useMemo, useRef, useState } from 'react';
import type { Answers } from './types';
import {
  defaultAnswers, mergeAnalysis, applyPreset,
  emptyIntake, loadSession, saveSession, clearSession, type IntakeState,
} from './state';
import { analyzeText, type AnalysisResult } from './logic/analyze';
import { assemblePolicy } from './logic/assemble';
import { LEGAL_DISCLAIMER, REVIEW_NOTICE, TEMPLATE_VERSION } from './data/clauses';
import { presetById } from './data/presets';
import { StepChooseEvent } from './components/StepChooseEvent';
import { StepIntake } from './components/StepIntake';
import { StepGaps } from './components/StepGaps';
import { StepCompose } from './components/StepCompose';
import { StepExport } from './components/StepExport';
import type { BlockEdits } from './components/PolicyPreview';
import './App.css';

const STEPS = ['Choose event', 'Your information', 'Complete & check', 'Review & trim', 'Download'] as const;

export default function App() {
  const restored = useRef(loadSession());
  const [step, setStep] = useState(restored.current?.step ?? 0);
  const [answers, setAnswers] = useState<Answers>(restored.current?.answers ?? defaultAnswers());
  const [intake, setIntake] = useState<IntakeState>(restored.current?.intake ?? emptyIntake());
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [edits, setEdits] = useState<BlockEdits>((restored.current?.edits as BlockEdits) ?? {});
  const [presetMarks, setPresetMarks] = useState<Set<string>>(new Set(restored.current?.presetMarks ?? []));

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  // Session persistence: sessionStorage only — this tab, this session, this device.
  useEffect(() => {
    saveSession({ step, answers, edits, intake, presetMarks: [...presetMarks] });
  }, [step, answers, edits, intake, presetMarks]);

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

  function handleChooseEvent(presetId: string | null, changeNotes: string) {
    if (presetId) {
      const { answers: prefilled, marks } = applyPreset(presetId);
      prefilled.changeNotes = changeNotes;
      setAnswers(prefilled);
      setPresetMarks(marks);
    } else {
      setAnswers(defaultAnswers());
      setPresetMarks(new Set());
    }
    setEdits({});
    setStep(1);
  }

  function handleAnalyse(text: string, jotformLink: string) {
    const result = analyzeText(text);
    setAnalysis(result);
    setAnswers((a) => mergeAnalysis({ ...a, jotformLink: jotformLink || a.jotformLink }, result));
    setStep(2);
  }

  function saveAnswersToFile() {
    const blob = new Blob([JSON.stringify({ answers, edits, intake }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elsaiprivacypolicy-answers-${answers.policyDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadAnswersFromFile(file: File) {
    try {
      const data = JSON.parse(await file.text()) as { answers: Answers; edits: BlockEdits; intake?: IntakeState };
      if (data.answers) {
        setAnswers({ ...defaultAnswers(), ...data.answers });
        setEdits(data.edits ?? {});
        if (data.intake) setIntake({ ...emptyIntake(), ...data.intake });
        setStep(2);
      }
    } catch {
      alert('That file could not be read as saved answers.');
    }
  }

  function startOver() {
    clearSession();
    setStep(0);
    setAnswers(defaultAnswers());
    setIntake(emptyIntake());
    setAnalysis(null);
    setEdits({});
    setPresetMarks(new Set());
  }

  return (
    <div className="app">
      <header className="masthead no-print">
        <div className="mast-inner">
          <div>
            <span className="brand">elsa<b>i</b>privacypolicy</span>
            <span className="tagline">Privacy-policy compiler for ELSA events — template-true, nothing leaves your browser</span>
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
          <summary>Legal disclaimer — no liability of the Tool’s developer or ELSA</summary>
          <p>{LEGAL_DISCLAIMER}</p>
        </details>
      </div>

      <main>
        {step === 0 && <StepChooseEvent onChoose={handleChooseEvent} />}
        {step === 1 && (
          <StepIntake
            intake={intake} setIntake={setIntake}
            onAnalyse={handleAnalyse} onBack={() => setStep(0)}
            presetName={presetById(answers.presetId)?.name}
          />
        )}
        {step === 2 && (
          <StepGaps
            answers={answers} setAnswers={setAnswers} analysis={analysis} presetMarks={presetMarks}
            onBack={() => setStep(1)} onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepCompose
            blocks={assembled} edits={edits} setEdits={setEdits}
            onBack={() => setStep(2)} onContinue={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <StepExport
            answers={answers} finalBlocks={finalBlocks}
            onBack={() => setStep(3)}
            onStartOver={startOver}
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
