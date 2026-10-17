'use client';

import { FormEvent, useState, useSyncExternalStore } from 'react';
import { ETHICS_SCENARIOS } from '@/lib/ethics-scenarios';
import { ethicsService } from '@/lib/api/ethics.service';
import { useEthicsState } from '@/lib/ethics/use-ethics-state';

const TOTAL = ETHICS_SCENARIOS.length;
const KEY_STORAGE = 'trsyp-ethics-moderator-key';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

/**
 * The key lives in sessionStorage (this tab only). Read through
 * useSyncExternalStore so the server render - which has no storage - and the
 * first client render agree, and the page swaps in once the key is known.
 */
const KEY_EVENT = 'trsyp-ethics-moderator-key';

function readStoredKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

function storeKey(value: string) {
  try {
    if (value) sessionStorage.setItem(KEY_STORAGE, value);
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    /* the key just won't survive a reload */
  }
  window.dispatchEvent(new Event(KEY_EVENT));
}

function subscribeKey(onChange: () => void) {
  window.addEventListener(KEY_EVENT, onChange);
  return () => window.removeEventListener(KEY_EVENT, onChange);
}

function stepLabel(step: number): string {
  if (step === 0) return 'Waiting to start';
  if (step > TOTAL) return 'Finished';
  return `Scenario ${step} of ${TOTAL}: ${ETHICS_SCENARIOS[step - 1].title}`;
}

/**
 * The moderators' remote. Everything here moves every participant's screen
 * within a few seconds: start, close voting while the results are shown,
 * then the next scenario. The key is kept for this browser tab only.
 */
export default function EthicsControl() {
  const key = useSyncExternalStore(subscribeKey, readStoredKey, () => '');
  const [keyInput, setKeyInput] = useState('');
  const [keyErr, setKeyErr] = useState('');
  const [checking, setChecking] = useState(false);

  const { state, stale, setState } = useEthicsState(3000);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState('');

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    setKeyErr('');
    setChecking(true);
    try {
      await ethicsService.checkKey(keyInput.trim());
      storeKey(keyInput.trim());
      setKeyInput('');
    } catch (error: unknown) {
      setKeyErr(errorMessage(error, 'That key did not work.'));
    } finally {
      setChecking(false);
    }
  };

  const lock = () => storeKey('');

  const go = async (step: number, votingOpen: boolean) => {
    setActionErr('');
    setBusy(true);
    try {
      setState(await ethicsService.setState({ step, votingOpen }, key));
    } catch (error: unknown) {
      setActionErr(errorMessage(error, 'The screens were not updated. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (!key) {
    return (
      <form className="dash-card mod-card" onSubmit={unlock}>
        <h1 className="mod-title">Ethics test control</h1>
        <p className="mod-text">Enter the moderator key to pace the Ethical Decision Test.</p>
        <div className="reg-field">
          <label className="reg-label" htmlFor="mod-key">Moderator key</label>
          <input
            id="mod-key"
            type="password"
            className={`reg-input ${keyErr ? 'reg-input-error' : ''}`}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          {keyErr && <span className="reg-error">{keyErr}</span>}
        </div>
        <button type="submit" className="dash-save-btn" disabled={checking || !keyInput.trim()}>
          {checking ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    );
  }

  const step = state?.step ?? 0;
  const onScenario = step >= 1 && step <= TOTAL;
  const next = step + 1;

  return (
    <div className="dash-card mod-card">
      <div className="mod-head">
        <h1 className="mod-title">Ethics test control</h1>
        <button type="button" className="ws-back" onClick={lock}>
          Lock
        </button>
      </div>

      {!state ? (
        <p className="mod-text">{stale ? 'Can’t reach the server. Retrying…' : 'Loading…'}</p>
      ) : (
        <>
          <dl className="mod-status">
            <dt>On every screen</dt>
            <dd>{stepLabel(step)}</dd>
            {onScenario && (
              <>
                <dt>Voting</dt>
                <dd className={state.votingOpen ? 'mod-open' : ''}>{state.votingOpen ? 'Open' : 'Closed'}</dd>
              </>
            )}
          </dl>

          <div className="mod-actions">
            {step === 0 && (
              <button type="button" className="dash-save-btn" onClick={() => go(1, true)} disabled={busy}>
                Start: show scenario 1
              </button>
            )}

            {onScenario && state.votingOpen && (
              <button type="button" className="dash-save-btn" onClick={() => go(step, false)} disabled={busy}>
                Close voting
              </button>
            )}

            {onScenario && !state.votingOpen && (
              <button type="button" className="dash-save-btn" onClick={() => go(next, true)} disabled={busy}>
                {step < TOTAL ? `Next: scenario ${next}` : 'Finish the test'}
              </button>
            )}

            {onScenario && !state.votingOpen && (
              <button type="button" className="dash-cancel-btn" onClick={() => go(step, true)} disabled={busy}>
                Reopen voting
              </button>
            )}
          </div>

          {actionErr && <span className="reg-error" style={{ display: 'block' }}>{actionErr}</span>}
          {stale && <p className="mod-text">Connection lost. Showing the last known state.</p>}

          <ol className="mod-steps">
            {ETHICS_SCENARIOS.map((s, i) => (
              <li key={s.id} className={i + 1 === step ? 'mod-steps-current' : i + 1 < step ? 'mod-steps-done' : ''}>
                <span>{s.title}</span>
                <button
                  type="button"
                  className="ws-back"
                  onClick={() => go(i + 1, true)}
                  disabled={busy || i + 1 === step}
                >
                  Jump here
                </button>
              </li>
            ))}
          </ol>

          {step !== 0 && (
            <button type="button" className="ws-back mod-reset" onClick={() => go(0, true)} disabled={busy}>
              Reset to “waiting to start”
            </button>
          )}
        </>
      )}
    </div>
  );
}
