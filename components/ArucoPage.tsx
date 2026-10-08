'use client';

import { useState, useEffect, FormEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { challengeService, ApiError } from '@/lib/api';
import type { ArucoStatusResponse } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import AuthModal from './AuthModal';

/** What markers 0-3 hand out. Marker 4 is the collector, where the word is typed in. */
const CLUES: Record<number, { source: string; clue: string }> = {
  0: { source: 'Red beacon', clue: 'k' },
  1: { source: 'Blue indicator', clue: 'it’s in blue and high' },
  2: { source: 'Red beacon', clue: 'y' },
  3: { source: 'Red beacon', clue: 's' },
};

const COLLECTOR_ID = 4;

function attemptsText(n: number): string {
  return `${n} more attempt${n === 1 ? '' : 's'}`;
}

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
}

export default function ArucoPage() {
  // ── Step 1: marker ID entry ─────────────────────────────────────────────
  const [markerInput, setMarkerInput] = useState('');
  const [markerError, setMarkerError] = useState<string | null>(null);
  const [markerId, setMarkerId] = useState<number | null>(null);

  function handleMarker(e: FormEvent) {
    e.preventDefault();
    const trimmed = markerInput.trim();
    if (!trimmed) return;

    const id = /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
    if (!(id in CLUES) && id !== COLLECTOR_ID) {
      setMarkerError('No marker with that ID.');
      return;
    }
    setMarkerId(id);
  }

  function resetToMarkerEntry() {
    setMarkerId(null);
    setMarkerInput('');
    setMarkerError(null);
  }

  const clue = markerId !== null ? CLUES[markerId] : undefined;

  return (
    <div className="challenge-pg aruco-pg">
      {/* Hero */}
      <section className="prog-hero">
        <div className="prog-hero-bg" />
        <div className="prog-hero-overlay" />
        <div className="prog-hero-inner">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="prog-eyebrow">
              <span className="prog-eyebrow-line" />
              <span className="prog-eyebrow-text">TRSYP 3.0 · ArUco Challenge</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h1 className="prog-hero-h">ARUCO</h1>
          </motion.div>
        </div>
      </section>

      <section className="aruco-section">
        <div className="prog-container">
          <AnimatePresence mode="wait">
            {markerId === null ? (
              <motion.div
                key="marker-entry"
                className="aruco-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="aruco-card-title">Enter a marker ID</h2>
                <p className="aruco-card-sub">Enter the ID of the ArUco marker you found.</p>
                <form className="trsyp-form" onSubmit={handleMarker}>
                  <div className="trsyp-form-group">
                    <label className="trsyp-label" htmlFor="aruco-id">
                      Marker ID
                    </label>
                    <div className="trsyp-input-wrapper">
                      <input
                        id="aruco-id"
                        className={`trsyp-input${markerError ? ' trsyp-input-error' : ''}`}
                        value={markerInput}
                        onChange={(e) => {
                          setMarkerInput(e.target.value);
                          setMarkerError(null);
                        }}
                        placeholder="e.g. 0"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </div>
                    {markerError && <p className="trsyp-field-error">{markerError}</p>}
                  </div>
                  <button type="submit" className="trsyp-btn-login" disabled={!markerInput.trim()}>
                    Reveal
                  </button>
                </form>
              </motion.div>
            ) : clue ? (
              <motion.div
                key={`clue-${markerId}`}
                className="aruco-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <span className="aruco-card-tag">
                  Marker {markerId} · {clue.source}
                </span>
                <p className="aruco-card-sub">The {clue.source.toLowerCase()} gives you</p>
                <p className="aruco-clue">“{clue.clue}”</p>
                <button type="button" className="trsyp-text-button aruco-back" onClick={resetToMarkerEntry}>
                  Enter another marker
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="collector"
                className="aruco-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
              >
                <span className="aruco-card-tag">Marker {COLLECTOR_ID} · Collector</span>
                <Collector onBack={resetToMarkerEntry} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

/** Marker 4: the answer form. Needs a signed-in account; 3 attempts per account. */
function Collector({ onBack }: { onBack: () => void }) {
  const initialized = useAuthStore((s) => s.initialized);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Keyed by the token it was fetched with, so a sign-out / account switch
  // never shows the previous account's progress.
  const [loaded, setLoaded] = useState<{
    token: string;
    status?: ArucoStatusResponse;
    error?: string;
  } | null>(null);
  const current = accessToken && loaded?.token === accessToken ? loaded : null;
  const status = current?.status ?? null;
  const loadError = current?.error ?? null;

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await useAuthStore.getState().getAccessToken();
        if (!token) return;
        const result = await challengeService.status(token);
        if (!cancelled) setLoaded({ token: accessToken, status: result });
      } catch (err) {
        if (!cancelled) setLoaded({ token: accessToken, error: errorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const token = await useAuthStore.getState().getAccessToken();
      if (!token) return;
      const result = await challengeService.submit(trimmed, token);
      if (accessToken) setLoaded({ token: accessToken, status: result });
      if (!result.correct && result.attemptsLeft > 0) {
        setFeedback(`Incorrect, you have ${attemptsText(result.attemptsLeft)}.`);
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    } catch (err) {
      setFeedback(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  let body: ReactNode;
  if (!initialized) {
    body = <p className="aruco-card-sub">Loading…</p>;
  } else if (!accessToken) {
    body = (
      <>
        <p className="aruco-card-sub">You need to be logged in to submit your answer.</p>
        <button type="button" className="trsyp-btn-login" onClick={() => setShowAuthModal(true)}>
          Log In
        </button>
      </>
    );
  } else if (loadError) {
    body = <p className="trsyp-field-error">{loadError}</p>;
  } else if (!status) {
    body = <p className="aruco-card-sub">Loading…</p>;
  } else if (status.solved) {
    body = (
      <div className="reg-success aruco-result">
        <div className="reg-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        </div>
        <h3 className="reg-success-title">Congrats, you guessed right!</h3>
      </div>
    );
  } else if (status.attemptsLeft === 0) {
    body = (
      <div className="reg-success aruco-result aruco-result-lost">
        <div className="reg-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h3 className="reg-success-title">No more attempts, you lost.</h3>
      </div>
    );
  } else {
    body = (
      <>
        <p className="aruco-card-sub">
          Put the clues together and enter the word. You have {status.attemptsLeft} attempt
          {status.attemptsLeft === 1 ? '' : 's'} left.
        </p>
        <form className={`trsyp-form${shake ? ' adm-gate-shake' : ''}`} onSubmit={handleSubmit}>
          <div className="trsyp-form-group">
            <label className="trsyp-label" htmlFor="aruco-answer">
              Your word
            </label>
            <div className="trsyp-input-wrapper">
              <input
                id="aruco-answer"
                className={`trsyp-input${feedback ? ' trsyp-input-error' : ''}`}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setFeedback(null);
                }}
                placeholder="The word"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
            {feedback && <p className="trsyp-field-error">{feedback}</p>}
          </div>
          <button type="submit" className="trsyp-btn-login" disabled={submitting || !answer.trim()}>
            {submitting ? 'Checking…' : 'Submit'}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      {body}
      <button type="button" className="trsyp-text-button aruco-back" onClick={onBack}>
        Enter another marker
      </button>
      {showAuthModal && (
        <AuthModal
          initialMode="login"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          pendingRoute="/aruco"
        />
      )}
    </>
  );
}
