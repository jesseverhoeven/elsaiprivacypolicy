import { useEffect, useMemo, useRef, useState } from 'react';
import type { Answers } from './types';
import {
  defaultAnswers, mergeAnalysis, applyPreset, applyUploadedPolicy,
  emptyIntake, loadSession, saveSession, clearSession, type IntakeState,
} from './state';
import { parseUploadedPolicy } from './logic/parsePolicy';
import { toPresetEvent } from './data/presets';
import { analyzeText, type AnalysisResult } from './logic/analyze';
import { assemblePolicy } from './logic/assemble';
import { LEGAL_DISCLAIMER, REVIEW_NOTICE, TEMPLATE_VERSION } from './data/clauses';
import { StepChooseEvent } from './components/StepChooseEvent';
import { StepGaps } from './components/StepGaps';
import { StepCompose } from './components/StepCompose';
import { StepExport } from './components/StepExport';
import type { BlockEdits } from './components/PolicyPreview';
import './App.css';

const STEPS = ['Choose event & info', 'Complete & check', 'Review & trim', 'Download'] as const;

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

  /**
   * Step 1 → 2: apply the chosen preset (if any), scan all provided information, merge.
   * New event + an uploaded previous privacy policy: the upload is parsed structurally
   * and its variable details are copied 1-on-1 into step 2, exactly like choosing a
   * previous event (user request 2026-07-12). That structural copy is authoritative,
   * so the keyword analyser (which only ever suggests) is skipped for it — otherwise
   * it would re-scan the very policy we just parsed and add noisy duplicate notes.
   */
  function handleContinue(presetId: string | null) {
    let base = presetId ? applyPreset(presetId) : { answers: defaultAnswers(), marks: new Set<string>() };
    let parsedUpload = false;
    if (!presetId) {
      const candidates = [
        ...intake.files.filter((f) => !f.error).map((f) => ({ text: f.text, name: f.name })),
        { text: intake.pasted, name: '' },
      ];
      for (const c of candidates) {
        const parsed = c.text.trim() ? parseUploadedPolicy(c.text, c.name) : null;
        if (parsed) { base = applyUploadedPolicy(toPresetEvent(parsed)); parsedUpload = true; break; }
      }
    }
    setPresetMarks(base.marks);
    const combined = [intake.files.map((f) => f.text).join('\n\n'), intake.pasted, intake.manual].join('\n\n');
    if (combined.trim() && !parsedUpload) {
      const result = analyzeText(combined);
      setAnalysis(result);
      setAnswers(mergeAnalysis(base.answers, result));
    } else {
      setAnalysis(null);
      setAnswers(base.answers);
    }
    setEdits({});
    setStep(1);
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
        setStep(1);
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

      {/* The unfoldable legal disclaimer lives only in the footer (user decision 2026-07-11). */}
      <div className="notice-banner no-print" role="note">{REVIEW_NOTICE}</div>

      <main>
        {step === 0 && <StepChooseEvent intake={intake} setIntake={setIntake} onContinue={handleContinue} />}
        {step === 1 && (
          <StepGaps
            answers={answers} setAnswers={setAnswers} analysis={analysis} presetMarks={presetMarks}
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
            onStartOver={startOver}
          />
        )}
      </main>

      <footer className="app-footer no-print">
        <p>
          Template set {TEMPLATE_VERSION} · Sources: Annex 4 — Template Privacy Policy &amp;{' '}
          <a href="/elsa-data-protection-handbook.pdf" target="_blank" rel="noopener">ELSA Data Protection Handbook (PDF)</a> ·
          No cookies, no analytics, no server — everything runs in your browser ·{' '}
          <a href="mailto:dataprotection@elsa.org">dataprotection@elsa.org</a>
        </p>
        <details className="disclaimer">
          <summary>Legal disclaimer</summary>
          <p>{LEGAL_DISCLAIMER}</p>
        </details>
        <p className="dev-credit">Developed by: Jesse Verhoeven</p>
      </footer>
    </div>
  );
}
