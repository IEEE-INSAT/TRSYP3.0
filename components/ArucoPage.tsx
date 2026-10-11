'use client';

import { useState, useEffect, useMemo, FormEvent, ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { challengeService, ApiError } from '@/lib/api';
import type { ArucoCollectorStatusResponse, ArucoMarker } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import { useHydrated } from '@/lib/store/use-hydrated';
import AuthModal from './AuthModal';

// ── Markers ─────────────────────────────────────────────────────────────────

const DICTIONARY = 'DICT_4X4_50';

/**
 * Inner 4×4 bits of every ID in the beacon register, in OpenCV's DICT_4X4_50
 * (1 = white cell), read straight from cv2.aruco.generateImageMarker so the
 * drawings match the printed markers. What each marker gives comes from the
 * backend, so closing the challenge hides it.
 */
const MARKER_BITS: Record<number, string[]> = {
  0: ['1011', '0101', '0011', '0010'],
  2: ['0011', '0011', '0010', '1101'],
  3: ['1001', '1001', '0100', '0110'],
  6: ['1001', '1110', '0010', '1110'],
  7: ['1100', '0100', '1111', '0010'],
  10: ['1111', '1001', '1001', '0001'],
  12: ['0000', '1110', '1011', '0111'],
  17: ['0110', '0110', '0000', '0000'],
  20: ['1000', '0110', '1000', '1011'],
  22: ['1100', '1100', '1101', '0101'],
  27: ['1010', '0101', '0101', '0100'],
  28: ['0010', '0001', '0010', '0011'],
  30: ['0100', '0100', '0001', '0101'],
  32: ['1001', '1110', '1100', '1111'],
  37: ['0000', '0100', '1111', '1111'],
  40: ['0001', '0111', '0001', '1000'],
  43: ['0011', '1000', '1011', '0010'],
  47: ['0100', '1011', '0110', '0100'],
};

const MAX_ATTEMPTS = 3;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ── Field log (per-device convenience, never authoritative) ─────────────────

const LOG_KEY = 'trsyp_aruco_log_v2';

function isMarker(value: unknown): value is ArucoMarker {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return typeof m.id === 'number' && m.id in MARKER_BITS && typeof m.kind === 'string' && typeof m.name === 'string';
}

function readLog(): ArucoMarker[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(LOG_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isMarker) : [];
  } catch {
    return [];
  }
}

function writeLog(markers: ArucoMarker[]) {
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(markers));
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

/** The backend's machine-readable error code (e.g. NO_COMPETITION_TEAM), if any. */
function errorCode(err: unknown): string | undefined {
  if (!(err instanceof ApiError) || !err.body || typeof err.body !== 'object') return undefined;
  const code = (err.body as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

/** Short label for a marker in the field log. */
function logLabel(m: ArucoMarker): string {
  if (m.kind !== 'collector' && m.clue && m.clue.length === 1) return `“${m.clue}”`;
  return m.name;
}

/** A marker drawn the way it's printed: white quiet zone, black border, 4×4 bits. */
function MarkerGlyph({ id, className }: { id: number; className?: string }) {
  const bits = MARKER_BITS[id];
  if (!bits) return null;
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
  phase: 'idle' | 'loading' | 'detected' | 'missing' | 'error';
  input: string;
  marker?: ArucoMarker;
  message?: string;
}

type ScopeState = 'idle' | 'loading' | 'detected' | 'missing' | 'closed';

export default function ArucoPage() {
  const reduce = useReducedMotion() ?? false;
  const hydrated = useHydrated();

  // ARUCO_OPEN on the backend; null until the server answers.
  const [open, setOpen] = useState<boolean | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    challengeService
      .state()
      .then((s) => !cancelled && setOpen(s.open))
      .catch((err) => !cancelled && setStateError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const [idInput, setIdInput] = useState('');
  const [scan, setScan] = useState<Scan>({ seq: 0, phase: 'idle', input: '' });

  // Stored log + anything found this visit (storage is read once hydrated, so
  // server and first client render agree). Later scans replace earlier ones.
  const [foundNow, setFoundNow] = useState<ArucoMarker[]>([]);
  const found = useMemo(() => {
    const byId = new Map<number, ArucoMarker>();
    for (const m of [...(hydrated ? readLog() : []), ...foundNow]) byId.set(m.id, m);
    return [...byId.values()];
  }, [hydrated, foundNow]);

  async function detect(raw: string) {
    const input = raw.trim();
    if (!input || open !== true) return;
    const seq = scan.seq + 1;
    const settle = (next: Omit<Scan, 'seq' | 'input'>) =>
      setScan((prev) => (prev.seq === seq ? { seq, input, ...next } : prev));

    setScan({ seq, phase: 'loading', input });
    if (!/^\d{1,3}$/.test(input)) {
      settle({ phase: 'missing' });
      return;
    }
    try {
      const marker = await challengeService.marker(Number(input));
      settle({ phase: 'detected', marker });
      setFoundNow((prev) => [...prev.filter((m) => m.id !== marker.id), marker]);
      writeLog([...found.filter((m) => m.id !== marker.id), marker]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        settle({ phase: 'missing' });
      } else if (err instanceof ApiError && err.status === 403) {
        // Closed while the page was open.
        setOpen(false);
        settle({ phase: 'idle' });
      } else {
        settle({ phase: 'error', message: errorMessage(err) });
      }
    }
  }

  function handleDetect(e: FormEvent) {
    e.preventDefault();
    void detect(idInput);
  }

  function revisit(id: number) {
    setIdInput(String(id));
    void detect(String(id));
  }

  const scopeState: ScopeState =
    open === false
      ? 'closed'
      : scan.phase === 'detected'
        ? 'detected'
        : scan.phase === 'missing'
          ? 'missing'
          : scan.phase === 'loading'
            ? 'loading'
            : 'idle';
  const marker = scan.phase === 'detected' ? scan.marker : undefined;
  const ready = open === true;
  const resultKey = open !== true ? `state-${String(open)}` : scan.phase === 'idle' ? 'idle' : `scan-${scan.seq}-${scan.phase}`;

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
              <span className="prog-eyebrow-text">TRSYP 3.0 · Garden &amp; Mine Games</span>
              <span className="prog-eyebrow-line" />
            </div>
            <h1 className="prog-hero-h">ARUCO</h1>
          </motion.div>
        </div>
      </section>

      <section className="aruco-stage">
        <div className="aruco-console">
          <Scope scan={scan} state={scopeState} marker={marker} reduce={reduce} />

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
                  disabled={!ready}
                  aria-describedby="aruco-result"
                />
                <button
                  type="submit"
                  className="aruco-cta"
                  disabled={!ready || !idInput.trim() || scan.phase === 'loading'}
                >
                  {scan.phase === 'loading' ? 'Reading…' : 'Detect'}
                </button>
              </div>
            </form>

            <div id="aruco-result" className="aruco-result" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={resultKey}
                  className="aruco-result-inner"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{
                    duration: reduce ? 0.15 : 0.4,
                    ease: EASE_OUT,
                    delay: scan.phase === 'detected' && !reduce ? 0.25 : 0,
                  }}
                >
                  {open === null && !stateError && <p className="aruco-result-text">Connecting to the scanner…</p>}

                  {open === null && stateError && (
                    <>
                      <h2 className="aruco-result-title">Scanner offline</h2>
                      <p className="aruco-feedback">{stateError}</p>
                    </>
                  )}

                  {open === false && (
                    <>
                      <h2 className="aruco-result-title">The ArUco challenge is closed</h2>
                      <p className="aruco-result-text">
                        Markers can’t be read right now. Check back once the organizers open the challenge.
                      </p>
                    </>
                  )}

                  {ready && scan.phase === 'idle' && (
                    <>
                      <h2 className="aruco-result-title">Find the markers</h2>
                      <p className="aruco-result-text">
                        Each ArUco marker on the field hides something. Enter a marker’s ID above to see what it
                        gives you. The collectors are where your team types its words.
                      </p>
                    </>
                  )}

                  {ready && scan.phase === 'loading' && <p className="aruco-result-text">Reading marker {scan.input}…</p>}

                  {ready && scan.phase === 'missing' && (
                    <>
                      <h2 className="aruco-result-title">No marker with ID {scan.input}</h2>
                      <p className="aruco-result-text">Check the ID your robot read and try again.</p>
                    </>
                  )}

                  {ready && scan.phase === 'error' && <p className="aruco-feedback">{scan.message}</p>}

                  {ready && marker && <MarkerResult marker={marker} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <FieldLog found={found} activeId={marker?.id ?? null} canOpen={ready} onOpen={revisit} />
      </section>
    </div>
  );
}

// ── Result for a detected marker ────────────────────────────────────────────

function MarkerResult({ marker }: { marker: ArucoMarker }) {
  if (marker.kind === 'collector' && marker.collector) {
    return <Collector collector={marker.collector} name={marker.name} />;
  }

  const tone = marker.kind === 'beacon' ? 'red' : 'neutral';
  const source = (
    <p className="aruco-source">
      <span className={`aruco-source-dot aruco-source-dot--${tone}`} />
      {marker.name} · {marker.game}
    </p>
  );

  if (!marker.clue) {
    return (
      <>
        {source}
        <h2 className="aruco-result-title">Nothing here yet</h2>
        <p className="aruco-result-text">This marker doesn’t give anything yet.</p>
      </>
    );
  }

  return (
    <>
      {source}
      {marker.clue.length === 1 ? (
        <span className="aruco-letter">{marker.clue}</span>
      ) : (
        <p className="aruco-phrase">“{marker.clue}”</p>
      )}
    </>
  );
}

// ── Scanner viewport ────────────────────────────────────────────────────────

function Scope({
  scan,
  state,
  marker,
  reduce,
}: {
  scan: Scan;
  state: ScopeState;
  marker?: ArucoMarker;
  reduce: boolean;
}) {
  let status: string;
  if (state === 'closed') status = 'Challenge closed';
  else if (state === 'loading') status = `Reading · ID ${scan.input}`;
  else if (state === 'missing') status = `No match · ID ${scan.input}`;
  else if (state === 'detected' && marker) status = `Detected · id=${marker.id} · ${marker.name}`;
  else status = 'Waiting for a marker';

  const id = marker?.id;

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
        {state === 'detected' && id !== undefined && (
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
      {(state === 'idle' || state === 'loading' || state === 'missing') && (
        <span className="aruco-scope-sweep aruco-scope-sweep--idle" />
      )}

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
  canOpen,
  onOpen,
}: {
  found: ArucoMarker[];
  activeId: number | null;
  canOpen: boolean;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="aruco-log">
      <div className="aruco-log-head">
        <h2 className="aruco-log-title">Field log</h2>
        <p className="aruco-log-count">
          {found.length} marker{found.length === 1 ? '' : 's'} scanned on this device
        </p>
      </div>
      {found.length === 0 ? (
        <p className="aruco-log-empty">Markers you scan show up here so you can reopen them.</p>
      ) : (
        <ol className="aruco-log-grid">
          {found.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className={`aruco-slot${activeId === m.id ? ' aruco-slot--active' : ''}`}
                onClick={() => onOpen(m.id)}
                disabled={!canOpen}
                aria-label={`Open marker ${m.id}, ${m.name}`}
              >
                <MarkerGlyph id={m.id} className="aruco-slot-marker" />
                <span className="aruco-slot-id">id={m.id}</span>
                <span className="aruco-slot-label">{logLabel(m)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Collector ───────────────────────────────────────────────────────────────

/**
 * A collector's answer form. Needs a signed-in member of a Competition team;
 * each team gets 3 attempts per collector.
 */
function Collector({ collector, name }: { collector: number; name: string }) {
  const initialized = useAuthStore((s) => s.initialized);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Keyed by the token (and retry) it was fetched with, so a sign-out,
  // account switch or retry never shows a stale result.
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{
    token: string;
    attempt: number;
    status?: ArucoCollectorStatusResponse;
    error?: string;
    errorCode?: string;
  } | null>(null);
  const current =
    accessToken && loaded?.token === accessToken && loaded.attempt === attempt ? loaded : null;
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
        const result = await challengeService.collectorStatus(collector, token);
        if (!cancelled) setLoaded({ token: accessToken, attempt, status: result });
      } catch (err) {
        if (!cancelled) {
          setLoaded({ token: accessToken, attempt, error: errorMessage(err), errorCode: errorCode(err) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, collector, attempt]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const token = await useAuthStore.getState().getAccessToken();
      if (!token) return;
      const result = await challengeService.submit(collector, trimmed, token);
      if (accessToken) setLoaded({ token: accessToken, attempt, status: result });
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
          Put your clues together, then log in to enter your team’s word. Each team gets {MAX_ATTEMPTS} attempts
          on this collector.
        </p>
        <button type="button" className="aruco-cta" onClick={() => setShowAuthModal(true)}>
          Log in
        </button>
      </>
    );
  } else if (current?.errorCode === 'NO_COMPETITION_TEAM') {
    body = (
      <div className="aruco-notice">
        <span className="aruco-notice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </span>
        <h2 className="aruco-result-title">Collectors are for Competition teams</h2>
        <p className="aruco-result-text">
          Your account isn’t on a Competition team, so it can’t submit here. If you’re competing and seeing this,
          speak to an organizer.
        </p>
      </div>
    );
  } else if (loadError || !status) {
    body = (
      <div className="aruco-notice aruco-notice--error">
        <span className="aruco-notice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v5M12 16.5v.01" />
          </svg>
        </span>
        <h2 className="aruco-result-title">Couldn’t open this collector</h2>
        <p className="aruco-result-text">{loadError}</p>
        <button type="button" className="aruco-cta aruco-cta--ghost" onClick={() => setAttempt((a) => a + 1)}>
          Try again
        </button>
      </div>
    );
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
            Your team’s word
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
        {name}
        {status && <span className="aruco-source-team">· Team {status.teamName}</span>}
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
