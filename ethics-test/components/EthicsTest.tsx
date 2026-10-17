'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SCENARIOS } from '@/lib/scenarios';
import { useEthicsState } from '@/lib/use-ethics-state';

type Vote = 'allow' | 'override';

const VOTES: { value: Vote; label: string; hint: string }[] = [
  { value: 'allow', label: 'Allow', hint: 'Let the decision stand' },
  { value: 'override', label: 'Override', hint: 'Step in and reverse it' },
];

const voteLabel = (v: Vote) => VOTES.find((o) => o.value === v)!.label;

const TOTAL = SCENARIOS.length;

/**
 * Ethical Decision Test, paced live by the moderators: every participant's
 * screen shows the scenario they put up, re-checked every few seconds and
 * reaching every phone within about 10 seconds of a change. A vote
 * is only acknowledged here - nothing is sent or saved - and the moderators
 * show the results on the big screen before moving everyone on. Both choices
 * look the same on purpose, so the screen doesn't lean either way.
 */
export default function EthicsTest() {
  const { state, stale } = useEthicsState();
  // This screen's own votes, by step. Gone when the page is left.
  const [votes, setVotes] = useState<Record<number, Vote>>({});
  const reduceMotion = useReducedMotion();

  const step = state?.step ?? 0;
  const scenario = step >= 1 && step <= TOTAL ? SCENARIOS[step - 1] : null;
  const finished = step > TOTAL;
  const myVote = votes[step];

  const motionProps = {
    initial: reduceMotion ? false : { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 },
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <main className="page">
      <div className="container">
        <header className="page-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="page-logo" src="/trsyp-logo.webp" alt="TRSYP" width={120} height={41} />
          <h1 className="page-title">Ethical Decision Test</h1>
          <p className="page-blurb">
            In each scenario an automated system has already decided. Choose whether to let the decision stand
            or override it. The moderators move everyone to the next scenario. Your answers aren&apos;t saved.
          </p>
        </header>

        <div className="card et-card" aria-live="polite">
          {!state ? (
            <p className="et-note">{stale ? 'Can’t reach the session. Retrying…' : 'Joining the session…'}</p>
          ) : (
            <>
              <ol className="et-progress" aria-hidden="true">
                {SCENARIOS.map((s, i) => (
                  <li
                    key={s.id}
                    className={`et-progress-step${i + 1 < step ? ' et-progress-step--done' : ''}${i + 1 === step ? ' et-progress-step--current' : ''}`}
                  />
                ))}
              </ol>

              <AnimatePresence mode="wait" initial={false}>
                {step === 0 ? (
                  <motion.div key="waiting" {...motionProps}>
                    <h2 className="et-title">Waiting for the moderators to start</h2>
                    <p className="et-note">Keep this page open. The first scenario appears here on its own.</p>
                  </motion.div>
                ) : finished ? (
                  <motion.div key="finished" {...motionProps}>
                    <h2 className="et-title">That&apos;s the end of the test</h2>
                    {Object.keys(votes).length > 0 && (
                      <ul className="et-summary">
                        {SCENARIOS.map((s, i) =>
                          votes[i + 1] ? (
                            <li key={s.id}>
                              <span>{s.title}</span>
                              <span className="et-summary-vote">{voteLabel(votes[i + 1])}</span>
                            </li>
                          ) : null,
                        )}
                      </ul>
                    )}
                    <p className="et-note">Thanks for taking part. These answers stay on this page and aren&apos;t saved.</p>
                  </motion.div>
                ) : scenario ? (
                  <motion.div key={scenario.id} {...motionProps}>
                    <p className="et-count">
                      Scenario {step} of {TOTAL}
                    </p>
                    <h2 className="et-title">{scenario.title}</h2>

                    <dl className="et-facts">
                      <dt>The situation</dt>
                      <dd>{scenario.situation}</dd>
                      <dt>{scenario.detail.label}</dt>
                      <dd>{scenario.detail.text}</dd>
                    </dl>

                    <p className="et-focus">{scenario.focus}</p>

                    {myVote ? (
                      <p className="et-status">
                        You chose <strong>{voteLabel(myVote)}</strong>. Watch the screen for the results.
                      </p>
                    ) : state.votingOpen ? (
                      <div className="et-votes" role="group" aria-label="Your decision">
                        {VOTES.map((v) => (
                          <button
                            key={v.value}
                            type="button"
                            className="et-vote"
                            onClick={() => setVotes((prev) => ({ ...prev, [step]: v.value }))}
                          >
                            <span className="et-vote-label">{v.label}</span>
                            <span className="et-vote-hint">{v.hint}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="et-status">Voting is closed for this scenario. Watch the screen for the results.</p>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {stale && <p className="et-note et-note--stale">Connection lost. Retrying…</p>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
