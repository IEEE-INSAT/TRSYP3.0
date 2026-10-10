'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore, useRegistrationStore } from '@/lib/store';
import { roomingService } from '@/lib/api/rooming.service';
import { roomingPhase } from '@/lib/config';
import type { Gender, Room } from '@/lib/api/types';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const GENDER_LABEL: Record<Gender, string> = { male: 'Male', female: 'Female' };

async function currentToken(): Promise<string> {
  return (await useAuthStore.getState().getAccessToken()) ?? '';
}

/**
 * The rooming section of the dashboard. Same flow as teams: the owner creates
 * a room and sends its code, the roommate joins with it. Every room is a
 * double, shared by two participants of the same gender - the server enforces
 * both, this screen just explains them.
 */
export default function RoomingSection() {
  const user = useRegistrationStore((s) => s.user);
  const hydrating = useRegistrationStore((s) => s.hydrating);
  const participantId = user?.participantId;

  const [room, setRoom] = useState<Room | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState('');

  // "No room yet" empty-state
  const [mode, setMode] = useState<'none' | 'join'>('none');
  const [joinCode, setJoinCode] = useState('');
  const [noRoomErr, setNoRoomErr] = useState('');
  const [noRoomSubmitting, setNoRoomSubmitting] = useState(false);

  const [actionErr, setActionErr] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Bumped by "Try again" to re-run the fetch below.
  const [reloadKey, setReloadKey] = useState(0);

  // Only a registered participant has a room to fetch.
  const hasProfile = !!user;
  useEffect(() => {
    if (!hasProfile) return;
    let cancelled = false;
    (async () => {
      try {
        const mine = await roomingService.getMyRoom(await currentToken());
        if (cancelled) return;
        setRoom(mine);
        setLoadErr('');
      } catch (error: unknown) {
        if (!cancelled) setLoadErr(errorMessage(error, 'Failed to load your room'));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasProfile, reloadKey]);

  const notRegistered = !user && !hydrating;
  const isOwner = !!room && !!participantId && room.ownerId === participantId;

  const handleCreate = async () => {
    setNoRoomErr('');
    setNoRoomSubmitting(true);
    try {
      setRoom(await roomingService.createRoom(await currentToken()));
    } catch (error: unknown) {
      setNoRoomErr(errorMessage(error, 'Failed to create room'));
    } finally {
      setNoRoomSubmitting(false);
    }
  };

  const handleJoin = async () => {
    setNoRoomErr('');
    if (joinCode.trim().length !== 6) {
      setNoRoomErr('Enter the 6-character room code.');
      return;
    }
    setNoRoomSubmitting(true);
    try {
      setRoom(await roomingService.joinRoom(joinCode.trim(), await currentToken()));
      setMode('none');
      setJoinCode('');
    } catch (error: unknown) {
      setNoRoomErr(errorMessage(error, 'Failed to join room'));
    } finally {
      setNoRoomSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setActionErr('');
    setRemovingId(memberId);
    try {
      setRoom(await roomingService.removeRoommate(memberId, await currentToken()));
    } catch (error: unknown) {
      setActionErr(errorMessage(error, 'Failed to remove roommate'));
    } finally {
      setRemovingId(null);
    }
  };

  // Owner disbands, roommate leaves - either way the caller ends up roomless.
  const handleExit = async () => {
    setActionErr('');
    setExiting(true);
    try {
      const token = await currentToken();
      if (isOwner) await roomingService.disbandRoom(token);
      else await roomingService.leaveRoom(token);
      setRoom(null);
      setConfirmExit(false);
    } catch (error: unknown) {
      setActionErr(errorMessage(error, isOwner ? 'Failed to disband room' : 'Failed to leave room'));
    } finally {
      setExiting(false);
    }
  };

  const handleCopyCode = () => {
    if (!room?.code) return;
    void navigator.clipboard.writeText(room.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const myGender = room?.gender ?? user?.gender;
  const genderLabel = myGender ? GENDER_LABEL[myGender] : null;

  return (
    <section className="dash-page dash-section">
      <div className="dash-container">
        <header className="dash-section-head">
          <span className="dash-section-kicker">Accommodation</span>
          <h1 className="dash-section-title">Your room</h1>
          <p className="dash-section-blurb">
            Every room is a double, shared with a participant of the same gender. Pick your
            roommate: create a room and send them its code, or join theirs.
          </p>
        </header>

        {notRegistered ? (
          <div className="dash-card dash-noteam-card">
            <div className="dash-card-title">Not registered yet</div>
            <p className="dash-noteam-msg">
              You need a participant profile before you can take a room. Complete your
              registration first.
            </p>
            <div className="dash-noteam-actions">
              <Link href="/register" className="dash-noteam-btn dash-noteam-btn-primary">
                Go to registration
              </Link>
            </div>
          </div>
        ) : !loaded ? (
          <div className="dash-card">
            <p className="dash-noteam-msg">Loading your room…</p>
          </div>
        ) : loadErr ? (
          <div className="dash-card dash-noteam-card">
            <div className="dash-card-title">Couldn&apos;t load your room</div>
            <span className="reg-error" style={{ display: 'block' }}>{loadErr}</span>
            <div className="dash-noteam-actions">
              <button type="button" className="dash-noteam-btn" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            </div>
          </div>
        ) : !room && roomingPhase !== 'open' ? (
          // Not taking rooms - say so instead of offering a form the server refuses.
          <motion.div className="dash-card dash-noteam-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="dash-card-title">{roomingPhase === 'soon' ? 'Rooming opens soon' : 'Rooming is closed'}</div>
            <p className="dash-noteam-msg">
              {roomingPhase === 'soon'
                ? "Picking roommates isn't open yet. We'll open it here as soon as it goes live."
                : 'Picking roommates is closed.'}
            </p>
          </motion.div>
        ) : !room ? (
          <motion.div className="dash-card dash-noteam-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="dash-card-title">No room yet</div>
            <p className="dash-noteam-msg">
              You&apos;re not in a room. Create one and send its code to your roommate, or join
              theirs with the code they sent you.
              {genderLabel && ` Rooms don't mix genders, so your roommate must also be ${genderLabel.toLowerCase()}.`}
            </p>

            {mode === 'none' && (
              <div className="dash-noteam-actions">
                <button type="button" className="dash-noteam-btn" onClick={() => { setNoRoomErr(''); setMode('join'); }} disabled={noRoomSubmitting}>
                  Join a room
                </button>
                <button type="button" className="dash-noteam-btn dash-noteam-btn-primary" onClick={handleCreate} disabled={noRoomSubmitting}>
                  {noRoomSubmitting ? 'Creating…' : 'Create a room'}
                </button>
              </div>
            )}

            {mode === 'join' && (
              <div className="dash-noteam-form">
                <input
                  className="dash-edit-input"
                  placeholder="6-character room code"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}
                />
                <div className="dash-noteam-form-actions">
                  <button type="button" className="dash-save-btn" onClick={handleJoin} disabled={noRoomSubmitting}>
                    {noRoomSubmitting ? 'Joining…' : 'Join'}
                  </button>
                  <button type="button" className="dash-cancel-btn" onClick={() => { setMode('none'); setNoRoomErr(''); }} disabled={noRoomSubmitting}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {noRoomErr && <span className="reg-error" style={{ display: 'block', marginTop: '12px' }}>{noRoomErr}</span>}
          </motion.div>
        ) : (
          <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="dash-card-title">Room Details</div>

            <div className="dash-detail-row dash-detail-highlight">
              <span className="dash-detail-label">Room</span>
              <span className="dash-detail-value">Double · {GENDER_LABEL[room.gender]}</span>
            </div>
            <div className="dash-detail-row">
              <span className="dash-detail-label">Occupancy</span>
              <span className="dash-detail-value">
                {room.memberCount}/{room.capacity} {room.spotsLeft > 0 ? '- waiting for your roommate' : '- full'}
              </span>
            </div>

            {isOwner && room.spotsLeft > 0 && (
              <>
                <div className="dash-detail-row dash-detail-code-row">
                  <span className="dash-detail-label">Room Code</span>
                  <div className="dash-code-wrap">
                    <code className="dash-code">{room.code}</code>
                    <button type="button" className="dash-code-copy" onClick={handleCopyCode}>
                      {codeCopied ? (
                        <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
                      ) : (
                        <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy</>
                      )}
                    </button>
                  </div>
                </div>
                <p className="dash-code-hint">
                  Send this code to your roommate so they can join. They must be{' '}
                  {GENDER_LABEL[room.gender].toLowerCase()} too.
                </p>
              </>
            )}

            <div className="dash-detail-divider">Occupants</div>

            <div className="dash-members-list">
              {room.members.map((m, i) => {
                const memberIsOwner = m.id === room.ownerId;
                return (
                  <div key={m.id} className="dash-member-mini">
                    <div className="dash-member-mini-header">
                      <span className="dash-member-mini-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="dash-member-mini-name">
                        {`${m.name} ${m.lastName}`.trim()}
                        {m.id === participantId && ' (you)'}
                      </span>
                      {memberIsOwner && <span className="dash-member-leader-badge">Owner</span>}
                      {isOwner && !memberIsOwner && (
                        <button
                          type="button"
                          className="dash-member-remove"
                          onClick={() => handleRemove(m.id)}
                          disabled={removingId === m.id}
                          aria-label={`Remove ${m.name}`}
                        >
                          {removingId === m.id ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </div>
                    {m.email && (
                      <div className="dash-member-mini-details">
                        <span>{m.email}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {actionErr && (
              <span className="reg-error" style={{ display: 'block', marginTop: '10px' }}>{actionErr}</span>
            )}

            <div className="dash-disband-row">
              {confirmExit ? (
                <>
                  <span className="dash-disband-confirm-text">
                    {isOwner
                      ? 'Disband this room? Your roommate will be moved out too.'
                      : 'Leave this room? You\'ll need the code again to rejoin.'}
                  </span>
                  <div className="dash-disband-actions">
                    <button type="button" className="dash-disband-btn" onClick={handleExit} disabled={exiting}>
                      {exiting ? (isOwner ? 'Disbanding…' : 'Leaving…') : isOwner ? 'Yes, disband' : 'Yes, leave'}
                    </button>
                    <button type="button" className="dash-cancel-btn" onClick={() => setConfirmExit(false)} disabled={exiting}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" className="dash-disband-btn" onClick={() => setConfirmExit(true)}>
                  {isOwner ? (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> Disband Room</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg> Leave Room</>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
