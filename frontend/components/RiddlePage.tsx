'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { challengeService, ApiError } from '@/lib/api';
import type { RiddleAccessResponse } from '@/lib/api';

export default function RiddlePage() {
  // ── Step 1: code entry ──────────────────────────────────────────────────
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [riddle, setRiddle] = useState<RiddleAccessResponse | null>(null);

  // ── Step 2: answer submission ────────────────────────────────────────────
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [shake, setShake] = useState(false);

  async function handleAccess(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setCodeError(null);
    try {
      const result = await challengeService.access(trimmed);
      setRiddle(result);
    } catch (err) {
      setCodeError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedAnswer = answer.trim();
    if (!riddle || !trimmedAnswer || submitting) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await challengeService.submit(code.trim(), trimmedAnswer);
      setRiddle((prev) => (prev ? { ...prev, solved: result.solved, attempts: result.attempts } : prev));

      if (result.correct) {
        setFeedback('correct');
      } else {
        setFeedback('incorrect');
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    } catch (err) {
      setCodeError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetToCodeEntry() {
    setRiddle(null);
    setCode('');
    setAnswer('');
    setFeedback(null);
    setCodeError(null);
  }

  return (
    <div className="challenge-pg riddle-pg">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">TRSYP 3.0 · Riddle Challenge</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h1 className="prog-hero-h">RIDDLE</h1>
          </motion.div>
        </div>
      </section>

      {/* Code entry / riddle */}
      <section className="riddle-section">
        <div className="prog-container">
          <AnimatePresence mode="wait">
            {!riddle ? (
              <motion.div
                key="code-entry"
                className="riddle-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="riddle-card-title">Enter your code</h2>
                <p className="riddle-card-sub">
                  Enter the code your team was given to unlock your riddle.
                </p>
                <form className="trsyp-form" onSubmit={handleAccess}>
                  <div className="trsyp-form-group">
                    <label className="trsyp-label" htmlFor="riddle-code">
                      Code
                    </label>
                    <div className="trsyp-input-wrapper">
                      <input
                        id="riddle-code"
                        className={`trsyp-input${codeError ? ' trsyp-input-error' : ''}`}
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setCodeError(null);
                        }}
                        placeholder="Enter your code"
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                    </div>
                    {codeError && <p className="trsyp-field-error">{codeError}</p>}
                  </div>
                  <button type="submit" className="trsyp-btn-login" disabled={loading || !code.trim()}>
                    {loading ? 'Checking…' : 'Unlock Riddle'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="riddle"
                className="riddle-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <span className="riddle-card-tag">Riddle {riddle.riddleNumber} of 3</span>

                {riddle.solved ? (
                  <div className="reg-success">
                    <div className="reg-success-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12l3 3 5-6" />
                      </svg>
                    </div>
                    <h3 className="reg-success-title">Solved!</h3>
                    <p className="reg-success-text">{riddle.question}</p>
                    <button className="reg-success-btn" onClick={resetToCodeEntry}>
                      Enter another code
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="riddle-question">{riddle.question}</p>
                    <form
                      className={`trsyp-form${shake ? ' adm-gate-shake' : ''}`}
                      onSubmit={handleSubmit}
                    >
                      <div className="trsyp-form-group">
                        <label className="trsyp-label" htmlFor="riddle-answer">
                          Your answer
                        </label>
                        <div className="trsyp-input-wrapper">
                          <input
                            id="riddle-answer"
                            className={`trsyp-input${feedback === 'incorrect' ? ' trsyp-input-error' : ''}`}
                            value={answer}
                            onChange={(e) => {
                              setAnswer(e.target.value);
                              setFeedback(null);
                            }}
                            placeholder="Solution word"
                            autoComplete="off"
                          />
                        </div>
                        {feedback === 'incorrect' && (
                          <p className="trsyp-field-error">
                            Not quite — try again. ({riddle.attempts} attempt
                            {riddle.attempts === 1 ? '' : 's'} so far)
                          </p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="trsyp-btn-login"
                        disabled={submitting || !answer.trim()}
                      >
                        {submitting ? 'Checking…' : 'Submit Answer'}
                      </button>
                    </form>
                    <button type="button" className="trsyp-text-button riddle-back" onClick={resetToCodeEntry}>
                      Use a different code
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
