'use client';

import { useState, useEffect, FormEvent, ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { challengeService, ApiError } from '@/lib/api';
import type { ArucoMarker, ArucoScansResponse, ArucoWordStatusResponse } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';
import AuthModal from './AuthModal';

// ── Markers ─────────────────────────────────────────────────────────────────

const DICTIONARY = 'DICT_4X4_50';

/**
 * Inner 4×4 bits of every ID in OpenCV's DICT_4X4_50 (1 = white cell), read
 * straight from cv2.aruco.generateImageMarker so the drawings match the
 * printed markers. All 50 are here because organizers can move a beacon to any
 * ID from the admin portal; what each marker gives comes from the backend, so
 * closing the challenge hides it.
 */
const MARKER_BITS: Record<number, string[]> = {
  0: ['1011', '0101', '0011', '0010'],
  1: ['0000', '1111', '1001', '1010'],
  2: ['0011', '0011', '0010', '1101'],
  3: ['1001', '1001', '0100', '0110'],
  4: ['0101', '0100', '1001', '1110'],
  5: ['0111', '1001', '1100', '1101'],
  6: ['1001', '1110', '0010', '1110'],
  7: ['1100', '0100', '1111', '0010'],
  8: ['1111', '1110', '1101', '1010'],
  9: ['1100', '1111', '0101', '0110'],
  10: ['1111', '1001', '1001', '0001'],
  11: ['0001', '0001', '1010', '0111'],
  12: ['0000', '1110', '1011', '0111'],
  13: ['0010', '1010', '0000', '1111'],
  14: ['0010', '0100', '1011', '0001'],
  15: ['0010', '0110', '0011', '1110'],
  16: ['0100', '0110', '0110', '0101'],
  17: ['0110', '0110', '0000', '0000'],
  18: ['0110', '1100', '0101', '1110'],
  19: ['0111', '0110', '1010', '1111'],
  20: ['1000', '0110', '1000', '1011'],
  21: ['1011', '0000', '0010', '1011'],
  22: ['1100', '1100', '1101', '0101'],
  23: ['1101', '1101', '1000', '0010'],
  24: ['1111', '1110', '0100', '0111'],
  25: ['1001', '0100', '0111', '0001'],
  26: ['1010', '1100', '1110', '0100'],
  27: ['1010', '0101', '0101', '0100'],
  28: ['0010', '0001', '0010', '0011'],
  29: ['0011', '0100', '0110', '1111'],
  30: ['0100', '0100', '0001', '0101'],
  31: ['0101', '0111', '1011', '0010'],
  32: ['1001', '1110', '1100', '1111'],
  33: ['1111', '0000', '1100', '1011'],
  34: ['0000', '1000', '1010', '1110'],
  35: ['0000', '1001', '0010', '1001'],
  36: ['0001', '1000', '0111', '0101'],
  37: ['0000', '0100', '1111', '1111'],
  38: ['0000', '1101', '1111', '0110'],
  39: ['0001', '1100', '0101', '1010'],
  40: ['0001', '0111', '0001', '1000'],
  41: ['0010', '1010', '0010', '1000'],
  42: ['0011', '0010', '1000', '1100'],
  43: ['0011', '1000', '1011', '0010'],
  44: ['0010', '0100', '1110', '1000'],
  45: ['0010', '1110', '1110', '1011'],
  46: ['0010', '1101', '0011', '1111'],
  47: ['0100', '1011', '0110', '0100'],
  48: ['0101', '0000', '0010', '1110'],
  49: ['0101', '0000', '0001', '0011'],
};

const MAX_ATTEMPTS = 3;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

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

/** The team's tries carried in a marker-lookup error body, if any. */
function errorScans(err: unknown): { used: number; limit: number } | undefined {
  if (!(err instanceof ApiError) || !err.body || typeof err.body !== 'object') return undefined;
  const { scansUsed, scanLimit } = err.body as { scansUsed?: unknown; scanLimit?: unknown };
  return typeof scansUsed === 'number' && typeof scanLimit === 'number'
    ? { used: scansUsed, limit: scanLimit }
    : undefined;
}

/** Short label for a marker in the field log. */
function logLabel(m: ArucoMarker): string {
  if (m.kind === 'letter' && m.content) return `“${m.content}”`;
  if (m.kind === 'hint' && m.hint) return `Hint ${m.hint}`;
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
  phase: 'idle' | 'loading' | 'detected' | 'missing' | 'limit' | 'error';
  input: string;
  marker?: ArucoMarker;
  message?: string;
}

type ScopeState = 'idle' | 'loading' | 'detected' | 'missing' | 'closed';

/** What stands between the visitor and the scanner. */
type Gate =
  | 'connecting'
  | 'offline'
  | 'closed'
  | 'checking'
  | 'login'
  | 'noTeam'
  | 'notPlaying'
  | 'accessError'
  | 'ready';

export default function ArucoPage() {
  const reduce = useReducedMotion() ?? false;

  // Whether the admin portal has a round live; null until the server answers.
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

  // Scanning is done by a team: a signed-in member of a Competition team,
  // whose tries (distinct IDs) are capped. Keyed by token + retry so a
  // sign-out, account switch or retry never shows a stale result.
  const initialized = useAuthStore((st) => st.initialized);
  const accessToken = useAuthStore((st) => st.accessToken);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [retry, setRetry] = useState(0);
  const [access, setAccess] = useState<{
    token: string;
    retry: number;
    scans?: ArucoScansResponse;
    error?: string;
    errorCode?: string;
  } | null>(null);
  const currentAccess = accessToken && access?.token === accessToken && access.retry === retry ? access : null;
  const scans = currentAccess?.scans ?? null;

  useEffect(() => {
    if (!accessToken || open !== true) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await useAuthStore.getState().getAccessToken();
        if (!token) return;
        const result = await challengeService.scans(token);
        if (!cancelled) setAccess({ token: accessToken, retry, scans: result });
      } catch (err) {
        if (cancelled) return;
        if (errorCode(err) === 'ARUCO_CLOSED') setOpen(false);
        setAccess({ token: accessToken, retry, error: errorMessage(err), errorCode: errorCode(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, open, retry]);

  // Every 20s, pull the team's log again: teammates' scans show up, and a new
  // round started from the admin portal clears what an open page still shows.
  const loadedScans = !!scans;
  useEffect(() => {
    if (!accessToken || !loadedScans) return;
    const timer = setInterval(async () => {
      try {
        const token = await useAuthStore.getState().getAccessToken();
        if (!token) return;
        const result = await challengeService.scans(token);
        setAccess((prev) => (prev?.token === accessToken && prev.retry === retry ? { ...prev, scans: result } : prev));
      } catch (err) {
        const code = errorCode(err);
        if (code === 'ARUCO_CLOSED') setOpen(false);
        if (code === 'ARUCO_CLOSED' || code === 'NOT_PLAYING' || code === 'NO_COMPETITION_TEAM') {
          setAccess((prev) =>
            prev?.token === accessToken && prev.retry === retry
              ? { token: accessToken, retry, error: errorMessage(err), errorCode: code }
              : prev,
          );
        }
        // Anything else (a dropped connection) keeps what's on screen until the next pull.
      }
    }, 20_000);
    return () => clearInterval(timer);
  }, [accessToken, retry, loadedScans]);

  /**
   * Keeps the tries counter, and the field log when a marker was found, in
   * step with what a lookup reported. A marker already in the log keeps its
   * place, as it does in the server's order.
   */
  function updateScans(next: { used: number; limit: number }, marker?: ArucoMarker) {
    setAccess((prev) => {
      if (!prev?.scans) return prev;
      const { found } = prev.scans;
      const nextFound = !marker
        ? found
        : found.some((m) => m.id === marker.id)
          ? found.map((m) => (m.id === marker.id ? marker : m))
          : [...found, marker];
      return { ...prev, scans: { ...prev.scans, ...next, found: nextFound } };
    });
  }

  let gate: Gate;
  if (open === null) gate = stateError ? 'offline' : 'connecting';
  else if (!open) gate = 'closed';
  else if (!initialized) gate = 'checking';
  else if (!accessToken) gate = 'login';
  else if (!currentAccess) gate = 'checking';
  else if (currentAccess.errorCode === 'NO_COMPETITION_TEAM') gate = 'noTeam';
  else if (currentAccess.errorCode === 'NOT_PLAYING') gate = 'notPlaying';
  else if (!scans) gate = 'accessError';
  else gate = 'ready';
  const ready = gate === 'ready';

  const [idInput, setIdInput] = useState('');
  const [scan, setScan] = useState<Scan>({ seq: 0, phase: 'idle', input: '' });

  // The team's log comes from the server, so every teammate sees the same one
  // and an organizer's reset empties it everywhere.
  const found = scans?.found ?? [];

  async function detect(raw: string) {
    const input = raw.trim();
    if (!input || !ready) return;
    const seq = scan.seq + 1;
    const settle = (next: Omit<Scan, 'seq' | 'input'>) =>
      setScan((prev) => (prev.seq === seq ? { seq, input, ...next } : prev));

    setScan({ seq, phase: 'loading', input });
    if (!/^\d{1,3}$/.test(input)) {
      settle({ phase: 'missing' });
      return;
    }
    try {
      const token = await useAuthStore.getState().getAccessToken();
      if (!token) return;
      const { scansUsed, scanLimit, ...marker } = await challengeService.marker(Number(input), token);
      updateScans({ used: scansUsed, limit: scanLimit }, marker);
      settle({ phase: 'detected', marker });
    } catch (err) {
      const code = errorCode(err);
      const tries = errorScans(err);
      if (tries) updateScans(tries);
      if (err instanceof ApiError && err.status === 404) {
        settle({ phase: 'missing' });
      } else if (code === 'SCAN_LIMIT_REACHED') {
        settle({ phase: 'limit' });
      } else if (code === 'ARUCO_CLOSED') {
        setOpen(false);
        settle({ phase: 'idle' });
      } else if (code === 'NO_COMPETITION_TEAM' || code === 'NOT_PLAYING') {
        setRetry((r) => r + 1);
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
    gate === 'closed'
      ? 'closed'
      : !ready
        ? 'idle'
        : scan.phase === 'detected'
          ? 'detected'
          : scan.phase === 'missing'
            ? 'missing'
            : scan.phase === 'loading'
              ? 'loading'
              : 'idle';
  const marker = ready && scan.phase === 'detected' ? scan.marker : undefined;
  const resultKey = !ready ? `gate-${gate}` : scan.phase === 'idle' ? 'idle' : `scan-${scan.seq}-${scan.phase}`;
  const triesLeft = scans ? Math.max(0, scans.limit - scans.used) : null;

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
              <div className="aruco-scanbar-head">
                <label className="aruco-field-label" htmlFor="aruco-id">
                  Marker ID
                </label>
                {ready && scans && triesLeft !== null && (
                  <span
                    className={`aruco-tries${triesLeft <= 3 ? ' aruco-tries--low' : ''}`}
                    title="Each new ID your team tries uses one try. Reopening one is free."
                  >
                    <span className="aruco-tries-num">{scans.used}</span>/{scans.limit} IDs tried
                  </span>
                )}
              </div>
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
                    delay: ready && scan.phase === 'detected' && !reduce ? 0.25 : 0,
                  }}
                >
                  {gate === 'connecting' && <p className="aruco-result-text">Connecting to the scanner…</p>}

                  {gate === 'offline' && (
                    <>
                      <h2 className="aruco-result-title">Scanner offline</h2>
                      <p className="aruco-feedback">{stateError}</p>
                    </>
                  )}

                  {gate === 'closed' && (
                    <>
                      <h2 className="aruco-result-title">The ArUco challenge is closed</h2>
                      <p className="aruco-result-text">
                        Markers can’t be read right now. Check back once the organizers open the challenge.
                      </p>
                    </>
                  )}

                  {gate === 'checking' && <p className="aruco-result-text">Checking your team…</p>}

                  {gate === 'login' && (
                    <>
                      <h2 className="aruco-result-title">Log in to scan</h2>
                      <p className="aruco-result-text">
                        Markers are read by Competition teams, and each team has a limited number of marker IDs to
                        try. Log in to start scanning.
                      </p>
                      <button type="button" className="aruco-cta aruco-result-cta" onClick={() => setShowAuthModal(true)}>
                        Log in
                      </button>
                    </>
                  )}

                  {gate === 'noTeam' && <NoTeamNotice />}

                  {gate === 'notPlaying' && <NotPlayingNotice />}

                  {gate === 'accessError' && (
                    <ErrorNotice
                      title="Couldn’t load your team"
                      message={currentAccess?.error}
                      onRetry={() => setRetry((r) => r + 1)}
                    />
                  )}

                  {ready && scan.phase === 'idle' && (
                    <>
                      <h2 className="aruco-result-title">Find the markers</h2>
                      <p className="aruco-result-text">
                        Each ArUco marker on the field hides something. Enter a marker’s ID above to see what it
                        gives you. Team {scans?.teamName} can try {scans?.limit} different IDs, so read them
                        carefully. Reopening one you already tried is free.
                      </p>
                    </>
                  )}

                  {ready && scan.phase === 'loading' && <p className="aruco-result-text">Reading marker {scan.input}…</p>}

                  {ready && scan.phase === 'missing' && (
                    <>
                      <h2 className="aruco-result-title">No marker with ID {scan.input}</h2>
                      <p className="aruco-result-text">
                        Check the ID your robot read. That try still counted
                        {triesLeft !== null && ` - ${triesLeft} left`}.
                      </p>
                    </>
                  )}

                  {ready && scan.phase === 'limit' && (
                    <div className="aruco-notice aruco-notice--error">
                      <span className="aruco-notice-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 018 0v4" />
                        </svg>
                      </span>
                      <h2 className="aruco-result-title">All {scans?.limit} tries used</h2>
                      <p className="aruco-result-text">
                        Your team can’t try new marker IDs any more. You can still reopen the markers your team
                        already tried from the field log.
                      </p>
                    </div>
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

      {showAuthModal && (
        <AuthModal
          initialMode="login"
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          pendingRoute="/aruco"
        />
      )}
    </div>
  );
}

// ── Notices ─────────────────────────────────────────────────────────────────

function NoTeamNotice() {
  return (
    <div className="aruco-notice">
      <span className="aruco-notice-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      </span>
      <h2 className="aruco-result-title">The ArUco challenge is for Competition teams</h2>
      <p className="aruco-result-text">
        Your account isn’t on a Competition team, so it can’t scan markers or submit words. If you’re competing and
        seeing this, speak to an organizer.
      </p>
    </div>
  );
}

function NotPlayingNotice() {
  return (
    <div className="aruco-notice">
      <span className="aruco-notice-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M4.9 4.9l14.2 14.2" />
        </svg>
      </span>
      <h2 className="aruco-result-title">Your team isn’t playing this game</h2>
      <p className="aruco-result-text">
        The organizers started this game for other teams. Your team can scan again once a game starts for it.
      </p>
    </div>
  );
}

function ErrorNotice({ title, message, onRetry }: { title: string; message?: string | null; onRetry: () => void }) {
  return (
    <div className="aruco-notice aruco-notice--error">
      <span className="aruco-notice-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
      </span>
      <h2 className="aruco-result-title">{title}</h2>
      {message && <p className="aruco-result-text">{message}</p>}
      <button type="button" className="aruco-cta aruco-cta--ghost" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

// ── Result for a detected marker ────────────────────────────────────────────

function MarkerResult({ marker }: { marker: ArucoMarker }) {
  if (marker.kind === 'collector') return <WordBox />;

  const isLetter = marker.kind === 'letter';
  return (
    <>
      <p className="aruco-source">
        <span className={`aruco-source-dot aruco-source-dot--${isLetter ? 'red' : 'blue'}`} />
        {marker.name}
        {marker.hint !== undefined && ` · Hint ${marker.hint}`}
      </p>
      {isLetter ? (
        <div className="aruco-letter-row">
          <span className="aruco-letter">{marker.content}</span>
        </div>
      ) : (
        // A hint's own text carries its quotes when it is a quotation.
        <p className="aruco-phrase">{marker.content}</p>
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
          {found.length} marker{found.length === 1 ? '' : 's'} found by your team
        </p>
      </div>
      {found.length === 0 ? (
        <p className="aruco-log-empty">Markers your team finds show up here so any of you can reopen them.</p>
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

// ── Word ────────────────────────────────────────────────────────────────────

/**
 * The word form markers 6 and 47 open: the live round's word, whichever of
 * the two was scanned. Needs a signed-in member of a team playing the round;
 * each team gets MAX_ATTEMPTS attempts per round.
 */
function WordBox() {
  const initialized = useAuthStore((s) => s.initialized);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Keyed by the token (and retry) it was fetched with, so a sign-out,
  // account switch or retry never shows a stale result.
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{
    token: string;
    attempt: number;
    status?: ArucoWordStatusResponse;
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
        const result = await challengeService.wordStatus(token);
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
  }, [accessToken, attempt]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const token = await useAuthStore.getState().getAccessToken();
      if (!token) return;
      const result = await challengeService.submitWord(trimmed, token);
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
          Put your clues together, then log in to enter your team’s word. Each team gets {MAX_ATTEMPTS} attempts.
        </p>
        <button type="button" className="aruco-cta" onClick={() => setShowAuthModal(true)}>
          Log in
        </button>
      </>
    );
  } else if (current?.errorCode === 'NO_COMPETITION_TEAM') {
    body = <NoTeamNotice />;
  } else if (current?.errorCode === 'NOT_PLAYING') {
    body = <NotPlayingNotice />;
  } else if (loadError || !status) {
    body = (
      <ErrorNotice title="Couldn’t open the word box" message={loadError} onRetry={() => setAttempt((a) => a + 1)} />
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
        Collector
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
