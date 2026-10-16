'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore, useRegistrationStore } from '@/lib/store';
import { workshopService } from '@/lib/api/workshop.service';
import type { TeamDuty, Workshop, WorkshopOverview } from '@/lib/api/types';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

async function currentToken(): Promise<string> {
  return (await useAuthStore.getState().getAccessToken()) ?? '';
}

/** Workshops grouped by session, sessions in order. */
function bySession(workshops: Workshop[]): [number, Workshop[]][] {
  const groups = new Map<number, Workshop[]>();
  for (const w of workshops) groups.set(w.session, [...(groups.get(w.session) ?? []), w]);
  return [...groups.entries()].sort(([a], [b]) => a - b);
}

/**
 * The rule for technical challenge teams, with where the caller's team
 * stands: pink until a member has a workshop seat, green after.
 */
function TeamNote({ team }: { team: TeamDuty }) {
  const points = Math.abs(team.sbPenalty) || null;
  return (
    <div className={`ws-duty${team.compliant ? ' ws-duty--ok' : ''}`}>
      <p className="ws-duty-head">Note for technical challenge teams</p>
      <p>
        At least one member of {team.teamName} must attend one of the workshops below, in either session.
        {team.compliant
          ? ' Your team is covered.'
          : ` Otherwise your SB loses ${points ? `${points} points` : 'points'}.`}
      </p>
      <dl className="ws-duty-status">
        <dt>In a workshop</dt>
        <dd>{team.inWorkshop.length ? team.inWorkshop.join(', ') : 'Nobody from your team yet'}</dd>
      </dl>
    </div>
  );
}

/**
 * Day-3 workshop booking. One seat per session, and bookings are final, so
 * booking asks for a confirmation first. Seat counts and the per-session rule
 * come from the server - this screen only reflects them.
 */
export default function WorkshopsSection() {
  const user = useRegistrationStore((s) => s.user);
  const hydrating = useRegistrationStore((s) => s.hydrating);

  const [overview, setOverview] = useState<WorkshopOverview | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // The workshop awaiting confirmation, the one a booking is in flight for,
  // and the error it came back with.
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<{ id: string; message: string } | null>(null);

  const hasProfile = !!user;
  useEffect(() => {
    if (!hasProfile) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await workshopService.getOverview(await currentToken());
        if (cancelled) return;
        setOverview(data);
        setLoadErr('');
      } catch (error: unknown) {
        if (!cancelled) setLoadErr(errorMessage(error, 'Failed to load workshops'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasProfile, reloadKey]);

  const book = async (workshopId: string) => {
    setActionErr(null);
    setBusyId(workshopId);
    try {
      setOverview(await workshopService.book(workshopId, await currentToken()));
      setConfirmId(null);
    } catch (error: unknown) {
      setActionErr({ id: workshopId, message: errorMessage(error, 'Something went wrong. Try again.') });
      // Seats move fast - show the counts the server has now.
      try {
        setOverview(await workshopService.getOverview(await currentToken()));
      } catch {
        /* keep the last overview */
      }
    } finally {
      setBusyId(null);
    }
  };

  const notRegistered = !user && !hydrating;
  const open = overview?.phase === 'open';
  const interactive = open && !!overview?.canBook;

  return (
    <section className="dash-page dash-section">
      <div className="dash-container">
        <header className="dash-section-head">
          <span className="dash-section-kicker">Day 3 · 18 October</span>
          <h1 className="dash-section-title">Workshops</h1>
          <p className="dash-section-blurb">
            Workshops in the same session run at the same time, so you get one seat per session.
            Bookings are final: once you book, you can&apos;t cancel or switch.
          </p>
        </header>

        {notRegistered ? (
          <div className="dash-card dash-noteam-card">
            <div className="dash-card-title">Not registered yet</div>
            <p className="dash-noteam-msg">You need a participant profile before you can book a workshop.</p>
            <div className="dash-noteam-actions">
              <Link href="/register" className="dash-noteam-btn dash-noteam-btn-primary">
                Go to registration
              </Link>
            </div>
          </div>
        ) : loadErr ? (
          <div className="dash-card dash-noteam-card">
            <div className="dash-card-title">Couldn&apos;t load workshops</div>
            <span className="reg-error" style={{ display: 'block' }}>{loadErr}</span>
            <div className="dash-noteam-actions">
              <button type="button" className="dash-noteam-btn" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            </div>
          </div>
        ) : !overview ? (
          <div className="dash-card">
            <p className="dash-noteam-msg">Loading workshops…</p>
          </div>
        ) : (
          <>
            {!open ? (
              <div className="ws-notice">
                {overview.phase === 'soon'
                  ? 'Booking opens soon. You can look through the workshops now and book here once it opens.'
                  : 'Booking is closed. The seats below are final.'}
              </div>
            ) : !overview.canBook ? (
              <div className="ws-notice">
                Workshop seats are for participants whose payment is confirmed.{' '}
                <Link href="/dashboard/payment">Check your payment</Link>
              </div>
            ) : null}

            {overview.team && <TeamNote team={overview.team} />}

            {bySession(overview.workshops).map(([session, workshops]) => {
              const mine = workshops.find((w) => w.bookedByMe);
              return (
                <motion.div
                  key={session}
                  className="dash-card ws-session"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="ws-session-head">
                    <h2 className="ws-session-title">Session {session}</h2>
                    <span className="ws-session-time">
                      {workshops.map((w) => w.startTime).sort()[0]}
                    </span>
                    <span className="ws-session-pick">{mine ? `Your seat: ${mine.title}` : 'No seat yet'}</span>
                  </div>


                  <ul className="ws-list">
                    {workshops.map((w) => {
                      const full = w.seatsLeft === 0 && !w.bookedByMe;
                      const fill = w.capacity ? Math.min(100, (w.booked / w.capacity) * 100) : 100;
                      const busy = busyId === w.id;
                      return (
                        <li
                          key={w.id}
                          className={`ws-item${w.bookedByMe ? ' ws-item--mine' : ''}${confirmId === w.id ? ' ws-item--confirming' : ''}`}
                        >
                          <div className="ws-item-main">
                            <h3 className="ws-item-title">{w.title}</h3>
                            <p className="ws-item-meta">
                              {[w.speaker, w.room, `${w.startTime}–${w.endTime}`].filter(Boolean).join(' · ')}
                            </p>
                            {w.audience && <p className="ws-item-audience">{w.audience}</p>}
                            <div
                              className="ws-seats"
                              role="meter"
                              aria-valuemin={0}
                              aria-valuemax={w.capacity}
                              aria-valuenow={w.booked}
                              aria-label={`${w.booked} of ${w.capacity} seats booked`}
                            >
                              <div className="ws-seats-bar"><span style={{ width: `${fill}%` }} /></div>
                              <span className="ws-seats-text">
                                {w.bookedByMe
                                  ? 'You have a seat'
                                  : full
                                    ? 'No seats left'
                                    : `${w.seatsLeft} ${w.seatsLeft === 1 ? 'seat' : 'seats'} left`}
                              </span>
                            </div>
                            {confirmId === w.id && (
                              <p id={`ws-confirm-${w.id}`} className="ws-confirm-note">
                                This seat is final. You can&apos;t cancel it or switch to another workshop in session{' '}
                                {w.session}.
                              </p>
                            )}
                            {actionErr?.id === w.id && (
                              <span className="reg-error" style={{ display: 'block', marginTop: '10px' }}>
                                {actionErr.message}
                              </span>
                            )}
                          </div>

                          {/* Bookings are final, so a session with a seat offers nothing else. */}
                          {interactive && !mine && (
                            <div className="ws-item-action">
                              {confirmId === w.id ? (
                                <div
                                  className="ws-confirm-actions"
                                  role="group"
                                  aria-describedby={`ws-confirm-${w.id}`}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape' && !busy) setConfirmId(null);
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="dash-noteam-btn dash-noteam-btn-primary ws-btn"
                                    onClick={() => book(w.id)}
                                    disabled={!!busyId}
                                  >
                                    {busy ? 'Booking…' : 'Confirm seat'}
                                  </button>
                                  {/* Focus lands on the safe choice. */}
                                  <button
                                    type="button"
                                    className="ws-back"
                                    onClick={() => setConfirmId(null)}
                                    disabled={busy}
                                    autoFocus
                                  >
                                    Back
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="dash-noteam-btn dash-noteam-btn-primary ws-btn"
                                  onClick={() => {
                                    setActionErr(null);
                                    setConfirmId(w.id);
                                  }}
                                  disabled={!!busyId || full}
                                >
                                  {full ? 'Full' : 'Book seat'}
                                </button>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
