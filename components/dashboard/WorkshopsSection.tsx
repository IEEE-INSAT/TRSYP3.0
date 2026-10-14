'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore, useRegistrationStore } from '@/lib/store';
import { workshopService } from '@/lib/api/workshop.service';
import type { Workshop, WorkshopOverview } from '@/lib/api/types';

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
 * Day-3 workshop booking. One seat per session; booking another workshop in
 * the same session moves the seat. Seat counts, the per-session rule and the
 * Pitching seats held for technical challenge teams all come from the server
 * - this screen only reflects them.
 */
export default function WorkshopsSection() {
  const user = useRegistrationStore((s) => s.user);
  const hydrating = useRegistrationStore((s) => s.hydrating);

  const [overview, setOverview] = useState<WorkshopOverview | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // The workshop a write is in flight for, and the error it came back with.
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

  const act = async (workshopId: string, action: 'book' | 'cancel') => {
    setActionErr(null);
    setBusyId(workshopId);
    try {
      const token = await currentToken();
      setOverview(
        action === 'book'
          ? await workshopService.book(workshopId, token)
          : await workshopService.cancel(workshopId, token),
      );
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
  const reserved = overview?.workshops.find((w) => w.reservesChallengeSeats);
  const team = overview?.challengeTeam;

  return (
    <section className="dash-page dash-section">
      <div className="dash-container">
        <header className="dash-section-head">
          <span className="dash-section-kicker">Day 3 · 18 October</span>
          <h1 className="dash-section-title">Workshops</h1>
          <p className="dash-section-blurb">
            Workshops in the same session run at the same time, so you get one seat per session.
            Booking another workshop in a session moves your seat there.
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

            {team && reserved && (
              <div className={`ws-team${team.reservedWorkshopBookers.length ? ' ws-team--ok' : ''}`}>
                <span className="ws-team-name">{team.name}</span>
                {team.reservedWorkshopBookers.length ? (
                  <p>
                    {team.reservedWorkshopBookers.join(', ')}{' '}
                    {team.reservedWorkshopBookers.length > 1 ? 'are' : 'is'} booked for the {reserved.title}. Your team
                    is covered.
                  </p>
                ) : (
                  <p>
                    At least one member of your team must attend the {reserved.title}. Nobody from your team has
                    booked yet, so a seat is held for you.
                  </p>
                )}
              </div>
            )}

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
                    <span className="ws-session-time">{workshops[0].startTime}</span>
                    <span className="ws-session-pick">{mine ? `Your seat: ${mine.title}` : 'No seat yet'}</span>
                  </div>

                  <ul className="ws-list">
                    {workshops.map((w) => {
                      const full = w.seatsLeft === 0 && !w.bookedByMe;
                      const fill = w.capacity ? Math.min(100, (w.booked / w.capacity) * 100) : 100;
                      const busy = busyId === w.id;
                      return (
                        <li key={w.id} className={`ws-item${w.bookedByMe ? ' ws-item--mine' : ''}`}>
                          <div className="ws-item-main">
                            <h3 className="ws-item-title">{w.title}</h3>
                            <p className="ws-item-meta">
                              {[w.speaker, w.room, `${w.startTime}–${w.endTime}`].filter(Boolean).join(' · ')}
                            </p>
                            {w.reservesChallengeSeats && (
                              <p className="ws-item-note">Mandatory for technical challenge teams: at least one member each</p>
                            )}
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
                            {actionErr?.id === w.id && (
                              <span className="reg-error" style={{ display: 'block', marginTop: '10px' }}>
                                {actionErr.message}
                              </span>
                            )}
                          </div>

                          {interactive && (
                            <div className="ws-item-action">
                              {w.bookedByMe ? (
                                <button
                                  type="button"
                                  className="dash-cancel-btn ws-btn"
                                  onClick={() => act(w.id, 'cancel')}
                                  disabled={!!busyId}
                                >
                                  {busy ? 'Cancelling…' : 'Cancel seat'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="dash-noteam-btn dash-noteam-btn-primary ws-btn"
                                  onClick={() => act(w.id, 'book')}
                                  disabled={!!busyId || full}
                                >
                                  {busy ? 'Booking…' : full ? 'Full' : mine ? 'Move here' : 'Book seat'}
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
