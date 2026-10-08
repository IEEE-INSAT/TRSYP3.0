'use client';

import { useState, useEffect, useMemo, FormEvent, ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { challengeService, ApiError } from '@/lib/api';
import type { ArucoStatusResponse } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import { useHydrated } from '@/lib/store/use-hydrated';
import AuthModal from './AuthModal';

// ── Markers ─────────────────────────────────────────────────────────────────

const DICTIONARY = 'DICT_4X4_50';

/**
 * Inner 4×4 bits of each marker in OpenCV's DICT_4X4_50 (1 = white cell),
 * read straight from cv2.aruco.generateImageMarker so the drawings match the
 * printed markers.
 */
const MARKER_BITS: Record<number, string[]> = {
  0: ['1011', '0101', '0011', '0010'],
  1: ['0000', '1111', '1001', '1010'],
  2: ['0011', '0011', '0010', '1101'],
  3: ['1001', '1001', '0100', '0110'],
  4: ['0101', '0100', '1001', '1110'],
};

type MarkerInfo =
  | { role: 'clue'; source: string; tone: 'red' | 'blue'; clue: string }
  | { role: 'collector' };

/** What each marker hands out. Marker 4 is the collector, where the word is typed in. */
const MARKERS: Record<number, MarkerInfo> = {
  0: { role: 'clue', source: 'Red beacon', tone: 'red', clue: 'k' },
  1: { role: 'clue', source: 'Blue indicator', tone: 'blue', clue: 'it’s in blue and high' },
  2: { role: 'clue', source: 'Red beacon', tone: 'red', clue: 'y' },
  3: { role: 'clue', source: 'Red beacon', tone: 'red', clue: 's' },
  4: { role: 'collector' },
};

const MARKER_IDS = Object.keys(MARKERS).map(Number);
const MAX_ATTEMPTS = 3;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ── Field log (per-device convenience, never authoritative) ─────────────────

const LOG_KEY = 'trsyp_aruco_log';

function readLog(): number[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(LOG_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number' && id in MARKERS) : [];
  } catch {
    return [];
  }
}

function writeLog(ids: number[]) {
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(ids));
  } catch {
    // Storage blocked (private mode etc.) - the log just won't persist.
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function attemptsText(n: number): string {
  return `${n} more attempt${n === 1 ? '' : 's'}`;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  // fetch() only throws (rather than resolving with an error status) when the
  // request never reached the server.
  if (err instanceof TypeError) return 'Can’t reach the server right now. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

/** A marker drawn the way it's printed: white quiet zone, black border, 4×4 bits. */
function MarkerGlyph({ id, className }: { id: number; className?: string }) {
  const bits = MARKER_BITS[id];
  return (
    <svg viewBox="0 0 8 8" className={className} shapeRendering="crispEdges" aria-hidden="true">
      <rect width="8" height="8" fill="#fff" />
      <rect x="1" y="1" width="6" height="6" fill="#000" />
      {bits.flatMap((row, r) =>
        [...row].map((bit, c) =>
          bit === '1' ? <rect key={`${r}-${c}`} x={2 + c} y={2 + r} width="1" height="1" fill="#fff" /> : null,
        ),
      )}
    </svg>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

/** `seq` bumps on every detection so the scanner replays even for the same ID. */
interface Scan {
  seq: number;
  input: string;
  id: number | null;
}

type ScanState = 'idle' | 'detected' | 'missing';

export default function ArucoPage() {
  const reduce = useReducedMotion() ?? false;
  const hydrated = useHydrated();

  const [idInput, setIdInput] = useState('');
  const [scan, setScan] = useState<Scan>({ seq: 0, input: '', id: null });

  // Stored log + anything found this visit (storage is read once hydrated, so
  // server and first client render agree).
  const [foundNow, setFoundNow] = useState<number[]>([]);
  const found = useMemo(
    () => new Set([...(hydrated ? readLog() : []), ...foundNow]),
    [hydrated, foundNow],
  );

  function detect(raw: string) {
    const input = raw.trim();
    if (!input) return;
    const id = /^\d{1,3}$/.test(input) ? Number(input) : null;
    const known = id !== null && id in MARKERS;
    setScan((prev) => ({ seq: prev.seq + 1, input, id: known ? id : null }));
    if (known && !found.has(id)) {
      setFoundNow((prev) => [...prev, id]);
      writeLog([...found, id]);
    }
  }

  function handleDetect(e: FormEvent) {
    e.preventDefault();
    detect(idInput);
  }

  function revisit(id: number) {
    setIdInput(String(id));
    detect(String(id));
  }

  const state: ScanState = scan.seq === 0 ? 'idle' : scan.id !== null ? 'detected' : 'missing';
  const info = scan.id !== null ? MARKERS[scan.id] : null;

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
              <span className="prog-eyebrow-text">TRSYP 3.0 · Marker Hunt</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h1 className="prog-hero-h">ARUCO</h1>
          </motion.div>
        </div>
      </section>

      <section className="aruco-stage">
        <div className="aruco-console">
          <Scope scan={scan} state={state} reduce={reduce} />

          <div className="aruco-readout">
            <form className="aruco-scanbar" onSubmit={handleDetect}>
              <label className="aruco-field-label" htmlFor="aruco-id">
                Marker ID
              </label>
              <div className="aruco-scanbar-row">
                <input
                  id="aruco-id"
                  className="aruco-scanbar-input"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-describedby="aruco-result"
                />
                <button type="submit" className="aruco-cta" disabled={!idInput.trim()}>
                  Detect
                </button>
              </div>
            </form>

            <div id="aruco-result" className="aruco-result" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={state === 'idle' ? 'idle' : `scan-${scan.seq}`}
                  className="aruco-result-inner"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{
                    duration: reduce ? 0.15 : 0.4,
                    ease: EASE_OUT,
                    delay: state === 'detected' && !reduce ? 0.25 : 0,
                  }}
                >
                  {state === 'idle' && (
                    <>
                      <h2 className="aruco-result-title">Find the markers</h2>
                      <p className="aruco-result-text">
                        Each ArUco marker on the field hides something. Enter a marker’s ID above to see what it
                        gives you. One of them is the collector, and that’s where you type the word.
                      </p>
                    </>
                  )}

                  {state === 'missing' && (
                    <>
                      <h2 className="aruco-result-title">No marker with ID {scan.input}</h2>
                      <p className="aruco-result-text">Check the ID your robot read and try again.</p>
                    </>
                  )}

                  {state === 'detected' && info?.role === 'clue' && (
                    <>
                      <p className="aruco-source">
                        <span className={`aruco-source-dot aruco-source-dot--${info.tone}`} />
                        {info.source} gives you
                      </p>
                      {info.clue.length === 1 ? (
                        <span className="aruco-letter">{info.clue}</span>
                      ) : (
                        <p className="aruco-phrase">“{info.clue}”</p>
                      )}
                    </>
                  )}

                  {state === 'detected' && info?.role === 'collector' && <Collector />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <FieldLog found={found} activeId={state === 'detected' ? scan.id : null} onOpen={revisit} />
      </section>
    </div>
  );
}

// ── Scanner viewport ────────────────────────────────────────────────────────

function Scope({ scan, state, reduce }: { scan: Scan; state: ScanState; reduce: boolean }) {
  const id = scan.id;
  const info = id !== null ? MARKERS[id] : null;

  let status: string;
  if (state === 'idle') status = 'Waiting for a marker';
  else if (state === 'missing') status = `No match · ID ${scan.input}`;
  else status = `Detected · id=${id} · ${info?.role === 'clue' ? info.source : 'Collector'}`;

  return (
    <div className={`aruco-scope aruco-scope--${state}`} aria-hidden="true">
      <div className="aruco-scope-grid" />
      <span className="aruco-scope-corner aruco-scope-corner--tl" />
      <span className="aruco-scope-corner aruco-scope-corner--tr" />
      <span className="aruco-scope-corner aruco-scope-corner--bl" />
      <span className="aruco-scope-corner aruco-scope-corner--br" />

      <div className="aruco-scope-hud aruco-scope-hud--top">
        <span>Scanner</span>
        <span>{DICTIONARY}</span>
      </div>

      <AnimatePresence mode="wait">
        {state === 'detected' && id !== null && (
          <motion.div
            key={scan.seq}
            className="aruco-scope-target"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.86, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
            transition={{ duration: reduce ? 0.15 : 0.5, ease: EASE_OUT }}
          >
            <div className="aruco-scope-tilt">
              <MarkerGlyph id={id} className="aruco-scope-marker" />
              {/* The overlay OpenCV's drawDetectedMarkers paints: outline, corner 0, id. */}
              <svg viewBox="0 0 8 8" className="aruco-scope-overlay">
                <motion.path
                  d="M1 1H7V7H1Z"
                  className="aruco-scope-outline"
                  initial={{ pathLength: reduce ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : 0.45, ease: EASE_OUT }}
                />
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: reduce ? 0 : 0.95 }}
                >
                  <rect x="0.78" y="0.78" width="0.44" height="0.44" className="aruco-scope-corner0" />
                  <text x="1.05" y="0.55" className="aruco-scope-id">
                    id={id}
                  </text>
                </motion.g>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state === 'detected' && !reduce && (
        <motion.span
          key={`sweep-${scan.seq}`}
          className="aruco-scope-sweep"
          initial={{ top: '0%', opacity: 1 }}
          animate={{ top: '100%', opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        />
      )}
      {state !== 'detected' && <span className="aruco-scope-sweep aruco-scope-sweep--idle" />}

      {state === 'missing' && (
        <motion.span
          key={`miss-${scan.seq}`}
          className="aruco-scope-miss"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}

      <div className="aruco-scope-hud aruco-scope-hud--bottom">
        <span className="aruco-scope-status">
          <span className="aruco-scope-status-dot" />
          {status}
        </span>
      </div>
    </div>
  );
}

// ── Field log ───────────────────────────────────────────────────────────────

function FieldLog({
  found,
  activeId,
  onOpen,
}: {
  found: Set<number>;
  activeId: number | null;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="aruco-log">
      <div className="aruco-log-head">
        <h2 className="aruco-log-title">Field log</h2>
        <p className="aruco-log-count">
          {found.size} of {MARKER_IDS.length} scanned on this device
        </p>
      </div>
      <ol className="aruco-log-grid">
        {MARKER_IDS.map((id) => {
          const info = MARKERS[id];
          if (!found.has(id)) {
            return (
              <li key={id} className="aruco-slot aruco-slot--empty">
                <span className="aruco-slot-blank" />
                <span className="aruco-slot-id aruco-slot-id--empty">id=?</span>
                <span className="aruco-slot-label">Not scanned</span>
              </li>
            );
          }
          return (
            <li key={id}>
              <button
                type="button"
                className={`aruco-slot${activeId === id ? ' aruco-slot--active' : ''}`}
                onClick={() => onOpen(id)}
                aria-label={`Open marker ${id}`}
              >
                <MarkerGlyph id={id} className="aruco-slot-marker" />
                <span className="aruco-slot-id">id={id}</span>
                <span className="aruco-slot-label">
                  {info.role === 'collector' ? 'Collector' : info.clue.length === 1 ? `“${info.clue}”` : info.source}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Collector (marker 4) ────────────────────────────────────────────────────

/** The answer form. Needs a signed-in account; 3 attempts per account. */
function Collector() {
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
        setAnswer('');
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
  if (!initialized || (accessToken && !status && !loadError)) {
    body = <p className="aruco-result-text">Loading…</p>;
  } else if (!accessToken) {
    body = (
      <>
        <h2 className="aruco-result-title">Log in to submit</h2>
        <p className="aruco-result-text">
          Put your clues together, then log in to enter the word. You get {MAX_ATTEMPTS} attempts.
        </p>
        <button type="button" className="aruco-cta" onClick={() => setShowAuthModal(true)}>
          Log in
        </button>
      </>
    );
  } else if (loadError || !status) {
    body = <p className="aruco-feedback">{loadError}</p>;
  } else if (status.solved) {
    body = (
      <div className="aruco-verdict aruco-verdict--won">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-6" />
        </svg>
        <h2 className="aruco-verdict-title">Congrats, you guessed right!</h2>
      </div>
    );
  } else if (status.attemptsLeft === 0) {
    body = (
      <div className="aruco-verdict aruco-verdict--lost">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
        <h2 className="aruco-verdict-title">No more attempts, you lost.</h2>
      </div>
    );
  } else {
    body = (
      <form className={`aruco-answer${shake ? ' adm-gate-shake' : ''}`} onSubmit={handleSubmit}>
        <div className="aruco-answer-head">
          <label className="aruco-field-label" htmlFor="aruco-answer">
            The word
          </label>
          <span
            className="aruco-pips"
            role="img"
            aria-label={`${status.attemptsLeft} of ${MAX_ATTEMPTS} attempts left`}
          >
            {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
              <span key={i} className={`aruco-pip${i < status.attemptsLeft ? ' aruco-pip--left' : ''}`} />
            ))}
          </span>
        </div>
        <input
          id="aruco-answer"
          className={`aruco-answer-input${feedback ? ' aruco-answer-input--error' : ''}`}
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setFeedback(null);
          }}
          placeholder="Type it here"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {feedback && <p className="aruco-feedback">{feedback}</p>}
        <button type="submit" className="aruco-cta" disabled={submitting || !answer.trim()}>
          {submitting ? 'Checking…' : 'Submit'}
        </button>
      </form>
    );
  }

  return (
    <>
      <p className="aruco-source">
        <span className="aruco-source-dot aruco-source-dot--green" />
        The collector
      </p>
      {body}
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
