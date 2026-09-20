'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store/use-auth';
import { useTeamStore, useRegistrationStore, useAuthStore, selectTeam, selectRole } from '@/lib/store';
import type { RegStatus } from '@/lib/store';
import { ACTIVITY_LABELS, TEAM_ACTIVITIES } from '@/lib/api/types';
import { computeFee, formatFee } from '@/lib/fees';
import ActivityToggle, { isActivityOpen, phaseOf } from './register/ActivityToggle';
import LoadingScreen from './LoadingScreen';
import UserAvatar from './UserAvatar';
// Single source of truth, shared with the dashboard section nav.
import { PAYMENT_ENABLED } from '@/lib/dashboard/sections';
import { useJustRegistered } from '@/lib/dashboard/just-registered';

/** The fee's four states, in the order a participant passes through them. */
const STATUS_MAP = {
  waiting_for_payment: { label: 'Not Paid', color: '#ff1d78', msg: 'Pay your registration fee and upload the proof to confirm your spot.' },
  waiting_for_verification: { label: 'Pending', color: '#f59e0b', msg: 'Your payment proof is in - waiting for approval. We\'ll notify you once it is verified.' },
  rejected: { label: 'Rejected', color: '#ef4444', msg: 'Your payment proof was turned down. Check the reason, then send a new one.' },
  approved: { label: 'Paid', color: '#00e87a', msg: 'Your registration is confirmed! See you at TRSYP 3.0!' },
} satisfies Record<RegStatus, { label: string; color: string; msg: string }>;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [showMembers, setShowMembers] = useState(false);
  // True only on the visit that follows completing registration.
  const justRegistered = useJustRegistered();

  // Gate the session check below on a settled auth state.
  const initialized = useAuthStore((s) => s.initialized);
  const account = useAuthStore((s) => s.account);
  const hydrating = useRegistrationStore((s) => s.hydrating);
  // Server-owned: the payment page is reachable either way, so the CTA just
  // says which of the two it leads to.
  const submissionOpen = useRegistrationStore((s) => s.paymentSubmissionOpen);

  const activity = useTeamStore((s) => s.activity);
  const setActivity = useTeamStore((s) => s.setActivity);
  const team = useTeamStore(selectTeam);
  const role = useTeamStore(selectRole);
  const otherTeam = useTeamStore((s) =>
    s.teams[s.activity === 'COMPETITION' ? 'CHALLENGE' : 'COMPETITION'],
  );
  const minTeamSize = activity === 'COMPETITION' ? 3 : 2;
  const teams = useTeamStore((s) => s.teams);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const updateTeam = useTeamStore((s) => s.updateTeam);
  const fetchTeams = useTeamStore((s) => s.fetchTeams);
  const createTeam = useTeamStore((s) => s.createTeam);
  const joinTeam = useTeamStore((s) => s.joinTeam);
  const removeMember = useTeamStore((s) => s.removeMember);
  const disbandTeam = useTeamStore((s) => s.disbandTeam);
  const leaveTeam = useTeamStore((s) => s.leaveTeam);
  const hydrateFromBackend = useRegistrationStore((s) => s.hydrateFromBackend);

  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamSize, setEditTeamSize] = useState(1);
  const [editTeamErr, setEditTeamErr] = useState('');
  const [editTeamSubmitting, setEditTeamSubmitting] = useState(false);

  const [teamActionErr, setTeamActionErr] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmDisband, setConfirmDisband] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [disbanding, setDisbanding] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // "No team yet" empty-state (kicked / left / never formed a team).
  const [teamMode, setTeamMode] = useState<'none' | 'join' | 'create'>('none');
  const [joinCode, setJoinCode] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSize, setNewTeamSize] = useState(3);
  const [noTeamErr, setNoTeamErr] = useState('');
  const [noTeamSubmitting, setNoTeamSubmitting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    // Don't judge the session until it has actually settled. `hydrateFromBackend`
    // briefly leaves `user` null while it reconciles the profile, and acting on
    // that gap fired a redirect *into* the in-flight navigation to this page -
    // two competing navigations abort each other ("this page couldn't load").
    // Same guard RegisterFlow uses before its own dashboard redirect.
    if (!initialized || hydrating) return;

    // During an explicit sign-out, let auth-store's signOut() own the single
    // redirect - issuing our own here would race it and abort the navigation.
    // Only redirect for genuine no-session access.
    if (!user && !useAuthStore.getState().signingOut) {
      // router.replace, not window.location - a full page load here would abort
      // whatever client-side transition brought us in.
      router.replace('/');
    }
  }, [initialized, hydrating, user, router]);

  // Fetch (and refresh) the team whenever the signed-in participant is known.
  // Re-running when `participantId` resolves also re-syncs `role`, which is what
  // makes the leader-only Edit button appear reliably instead of racing the
  // profile hydration.
  //
  // ⚠️ This hook MUST stay above the `!user` early return below. When the user
  // signs out `user` becomes null; if the return sat before this hook, the
  // render would call fewer hooks than the previous one and React would crash
  // the tree ("rendered fewer hooks than expected"), surfacing a black
  // "page couldn't load" error screen until signOut's navigation recovers it.
  useEffect(() => {
    if (user) void fetchTeams();
  }, [user, fetchTeams]);

  // Both registration windows are closed, so the tabs are no longer a choice -
  // they only switch between teams the participant already has. Someone entered
  // in exactly one track is put on that track regardless of the persisted
  // selection: a challenge-only member would otherwise open the dashboard on
  // the competition tab (the store's default) and see none of their own team.
  useEffect(() => {
    if (!teamLoaded) return;
    const entered = TEAM_ACTIVITIES.filter((a) => !!teams[a]);
    if (entered.length === 1 && entered[0] !== activity) setActivity(entered[0]);
  }, [teamLoaded, teams, activity, setActivity]);

  if (!user) return <LoadingScreen />;

  const status = STATUS_MAP[user.status];

  const activityLabel = ACTIVITY_LABELS[activity];
  const activityOpen = isActivityOpen(activity);

  const isChallenger = user.userType === 'challenger' || !!team || !!otherTeam;

  // Priced off the same three facts the server uses, so it tracks a team
  // join or a RAS toggle immediately instead of waiting for a profile refetch.
  const feeInfo = computeFee({ isIeee: user.isIeee, isRas: user.isRas, isChallenger });

  // Teams are opt-in: plenty of participants attend TRSYP 3.0 without entering
  // either track. So this is an invitation to join, never a required step - it
  // just shows the create/join controls whenever the selected activity is open
  // and the user has no team in it. Gated on `teamLoaded` so it doesn't flash
  // while the teams are still being fetched. Entering a track is optional and
  // offered to every registered participant - registration itself no longer
  // splits into participant/challenger, so the dashboard is where a team is
  // formed, by anyone who wants one.
  const canJoinActivity = teamLoaded && !team && activityOpen;

  const anyActivityOpen = TEAM_ACTIVITIES.some(isActivityOpen);

  // The switcher earns its place only when there is genuinely more than one
  // track to switch between: a participant entered in both, or a window still
  // open to enter. Entered in one track only - the common case now that both
  // windows are closed - it is a single dead tab in front of the team they
  // came to see, so the team details stand on their own instead. A participant
  // with no team at all has nothing here either way.
  const hasBothTeams = !!team && !!otherTeam;
  const showActivityToggle = hasBothTeams || anyActivityOpen;

  // "This track is closed" only needs saying to someone who might still have
  // been trying to enter it, i.e. while some window is open. Otherwise the
  // switcher that could reach a closed track isn't shown in the first place.
  const showClosedNotice = anyActivityOpen && teamLoaded && !team && !activityOpen;

  // Team rows describe the *selected* activity only. Before the first fetch
  // resolves we still show the registration store's cached team name so the
  // card doesn't flash empty.
  const showTeam = team ? true : !teamLoaded && isChallenger;

  // Derive leader status at render time so it self-corrects once both the team
  // and the participant id have loaded - the persisted `role` snapshot can be
  // stale if the team fetch won the race against profile hydration.
  const isLeader =
    role === 'leader' ||
    (!!team && !!user.participantId && team.leaderId === user.participantId);

  const handleEditTeam = () => {
    setEditTeamName(team?.name || user?.teamName || '');
    setEditTeamSize(team?.size || (user?.memberCount ? user.memberCount + 1 : 1));
    setEditTeamErr('');
    setIsEditingTeam(true);
  };

  const handleSaveTeam = async () => {
    setEditTeamErr('');
    if (editTeamName.trim().length < 2 || editTeamName.trim().length > 50) {
      setEditTeamErr('Team name must be 2–50 characters.');
      return;
    }
    const currentMemberCount = team?.members?.length || (user?.memberCount ? user.memberCount + 1 : 1);
    const minSize = Math.max(minTeamSize, currentMemberCount);
    if (editTeamSize < minSize || editTeamSize > 6) {
      setEditTeamErr(`Team size must be between ${minSize} and 6.`);
      return;
    }

    setEditTeamSubmitting(true);
    try {
      await updateTeam(editTeamName.trim(), editTeamSize);
      await hydrateFromBackend();
      setIsEditingTeam(false);
    } catch (error: unknown) {
      setEditTeamErr(errorMessage(error, 'Failed to update team'));
    } finally {
      setEditTeamSubmitting(false);
    }
  };

  const handleRemoveMember = async (participantId: string) => {
    setTeamActionErr('');
    setRemovingId(participantId);
    try {
      await removeMember(participantId);
      await hydrateFromBackend();
    } catch (error: unknown) {
      setTeamActionErr(errorMessage(error, 'Failed to remove member'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleDisbandTeam = async () => {
    setTeamActionErr('');
    setDisbanding(true);
    try {
      await disbandTeam();
      await hydrateFromBackend();
      setConfirmDisband(false);
    } catch (error: unknown) {
      setTeamActionErr(errorMessage(error, 'Failed to disband team'));
    } finally {
      setDisbanding(false);
    }
  };

  const handleLeaveTeam = async () => {
    setTeamActionErr('');
    setLeaving(true);
    try {
      await leaveTeam();
      await hydrateFromBackend();
      setConfirmLeave(false);
    } catch (error: unknown) {
      setTeamActionErr(errorMessage(error, 'Failed to leave team'));
    } finally {
      setLeaving(false);
    }
  };

  const handleJoinTeam = async () => {
    setNoTeamErr('');
    if (joinCode.trim().length !== 6) {
      setNoTeamErr('Enter the 6-character team code.');
      return;
    }
    setNoTeamSubmitting(true);
    try {
      await joinTeam(joinCode.trim().toUpperCase());
      await hydrateFromBackend();
      setTeamMode('none');
      setJoinCode('');
    } catch (error: unknown) {
      setNoTeamErr(errorMessage(error, 'Failed to join team'));
    } finally {
      setNoTeamSubmitting(false);
    }
  };

  const handleCreateTeam = async () => {
    setNoTeamErr('');
    if (newTeamName.trim().length < 2 || newTeamName.trim().length > 50) {
      setNoTeamErr('Team name must be 2–50 characters.');
      return;
    }
    if (newTeamSize < minTeamSize || newTeamSize > 6) {
      setNoTeamErr(`Team size must be between ${minTeamSize} and 6.`);
      return;
    }
    setNoTeamSubmitting(true);
    try {
      await createTeam(newTeamName.trim(), newTeamSize);
      await hydrateFromBackend();
      setTeamMode('none');
      setNewTeamName('');
    } catch (error: unknown) {
      setNoTeamErr(errorMessage(error, 'Failed to create team'));
    } finally {
      setNoTeamSubmitting(false);
    }
  };

  const teamMembers = team?.members ?? [];

  const handleCopyCode = () => {
    if (!team?.code) return;
    void navigator.clipboard.writeText(team.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="dash-page">
      <div className="dash-container">
        {/* Header */}
        <motion.div className="dash-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="dash-header-left">
            <h1 className="dash-welcome">
              {justRegistered ? 'Your registration is complete' : 'Welcome back'},{' '}
              {isChallenger ? `Team ${team?.name || otherTeam?.name || user.teamName || 'Member'}` : user.fullName}!
            </h1>
            <span className={`dash-type-badge ${isChallenger ? 'dash-type-challenger' : 'dash-type-participant'}`}>
              {isChallenger ? 'Challenger' : 'Participant'}
            </span>
          </div>
        </motion.div>

        <motion.section
          className="dash-card dash-profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          aria-labelledby="profile-heading"
        >
          <UserAvatar account={account} className="dash-profile-avatar" />
          <div className="dash-profile-copy">
            <span className="dash-profile-kicker">Your profile</span>
            <h2 id="profile-heading">
              {account
                ? `${account.name} ${account.lastName}`.trim()
                : user.fullName}
            </h2>
            <p>{account?.email ?? user.email}</p>
            <span className="dash-profile-role">
              {isChallenger ? 'Challenger' : 'Participant'}
            </span>
          </div>
          <div className="dash-profile-actions">
            <Link className="dash-profile-edit" href="/dashboard/profile">
              Edit profile
            </Link>
            <Link className="dash-profile-edit" href="/dashboard/avatar">
              Change avatar
            </Link>
          </div>
        </motion.section>

        {/* Status + fee: two facts about the same thing, so one card.
            Headline row (what you owe / where you stand), then a rule, then
            the detail line and its action - two zones instead of four
            loose groups. */}
        <motion.section
          className="dash-card dash-reg-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.09 }}
          aria-labelledby="reg-heading"
        >
          <div className="dash-reg-top">
            <div className="dash-reg-fee">
              <span className="dash-card-title" id="reg-heading">Registration Fee</span>
              <span className="dash-fee-amount">{formatFee(feeInfo)}</span>
            </div>

            {PAYMENT_ENABLED && (
              <span className="dash-status-badge" style={{ background: `${status.color}18`, color: status.color, borderColor: `${status.color}33` }}>
                {status.label}
              </span>
            )}
          </div>

          {PAYMENT_ENABLED && (
            <div className="dash-reg-foot">
              <p className="dash-status-msg">{status.msg}</p>

              {/* The payment page is open even while proof submission is
                  not - it carries the fee table - so the link says where it
                  leads. No team lock: attending without entering either
                  track is a valid path, so payment stays reachable for
                  team-less users. */}
              {(user.status === 'waiting_for_payment' || user.status === 'rejected') && (
                <Link href="/dashboard/payment" className="dash-reg-link">
                  {user.status === 'rejected'
                    ? 'Send a new proof'
                    : submissionOpen
                      ? 'Submit payment proof'
                      : 'See the fees'}{' '}
                  &rarr;
                </Link>
              )}
              {user.status === 'waiting_for_verification' && user.paymentFileName && (
                <span className="dash-reg-note">{user.paymentFileName}</span>
              )}
            </div>
          )}
        </motion.section>

        {/* Which track the team panels below refer to */}
        {showActivityToggle && (
        <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
          <div className="dash-card-title">Your Teams</div>
          <ActivityToggle
            value={activity}
            label={null}
            onChange={(next) => {
              // Drop any in-flight edit so it can't be applied to the other track.
              setIsEditingTeam(false);
              setTeamMode('none');
              setConfirmDisband(false);
              setConfirmLeave(false);
              setNoTeamErr('');
              setTeamActionErr('');
              setActivity(next);
            }}
          />
        </motion.div>
        )}

        {/* Selected track is not taking teams yet - say so instead of offering a form */}
        {showClosedNotice && (
          <motion.div className="dash-card dash-noteam-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <div className="dash-card-title">{activityLabel}</div>
            <p className="dash-noteam-msg">
              {phaseOf(activity) === 'soon'
                ? `${activityLabel} team registration opens soon. We'll open it here as soon as it goes live.`
                : `${activityLabel} team registration is closed.`}
            </p>
          </motion.div>
        )}

        {/* No team in this track yet - optionally (re)join or create one */}
        {canJoinActivity && (
          <motion.div className="dash-card dash-noteam-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <div className="dash-card-title">Your {activityLabel} Team</div>
            <p className="dash-noteam-msg">
              You&apos;re not in a {activityLabel.toLowerCase()} team. Entering is optional - you&apos;re
              registered for TRSYP 3.0 either way. To take part, join a team with a code or create
              your own and invite members.
            </p>

            {teamMode === 'none' && (
              <div className="dash-noteam-actions">
                <button type="button" className="dash-noteam-btn" onClick={() => { setNoTeamErr(''); setTeamMode('join'); }}>
                  Join a team
                </button>
                <button type="button" className="dash-noteam-btn dash-noteam-btn-primary" onClick={() => { setNoTeamErr(''); setTeamMode('create'); }}>
                  Create your own team
                </button>
              </div>
            )}

            {teamMode === 'join' && (
              <div className="dash-noteam-form">
                <input
                  className="dash-edit-input"
                  placeholder="6-character team code"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}
                />
                <div className="dash-noteam-form-actions">
                  <button type="button" className="dash-save-btn" onClick={handleJoinTeam} disabled={noTeamSubmitting}>
                    {noTeamSubmitting ? 'Joining…' : 'Join'}
                  </button>
                  <button type="button" className="dash-cancel-btn" onClick={() => { setTeamMode('none'); setNoTeamErr(''); }} disabled={noTeamSubmitting}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {teamMode === 'create' && (
              <div className="dash-noteam-form">
                <div className="reg-field">
                  <label className="reg-label">Team Name *</label>
                  <input
                    className="dash-edit-input"
                    placeholder="Team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>

                <div className="reg-field">
                  <label className="reg-label">Team Size (including you) *</label>
                  <div className="reg-count-group">
                    {[2, 3, 4, 5, 6].filter((n) => n >= minTeamSize).map((n) => (
                      <button key={n} type="button" className={`reg-count-btn ${newTeamSize === n ? 'reg-count-btn-active' : ''}`} onClick={() => setNewTeamSize(n)}>{n}</button>
                    ))}
                  </div>
                </div>

                <div className="dash-noteam-form-actions">
                  <button type="button" className="dash-save-btn" onClick={handleCreateTeam} disabled={noTeamSubmitting}>
                    {noTeamSubmitting ? 'Creating…' : 'Create'}
                  </button>
                  <button type="button" className="dash-cancel-btn" onClick={() => { setTeamMode('none'); setNoTeamErr(''); }} disabled={noTeamSubmitting}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {noTeamErr && <span className="reg-error" style={{ display: 'block', marginTop: '12px' }}>{noTeamErr}</span>}
          </motion.div>
        )}

        {/* Registration Details */}
        <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="dash-card-title">Registration Details</div>

          {showTeam && (
            <div className="dash-detail-row dash-detail-highlight">
              <span className="dash-detail-label">{activityLabel} Team</span>
              {isEditingTeam ? (
                <input className="dash-edit-input" value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} style={{ width: '100%', maxWidth: '250px' }} />
              ) : (
                <span className="dash-detail-value" style={{ display: 'flex', alignItems: 'center' }}>
                  {team?.name || user.teamName}
                  {isLeader && (
                    <button type="button" onClick={handleEditTeam} className="dash-edit-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                      Edit
                    </button>
                  )}
                </span>
              )}
            </div>
          )}
          {showTeam && (
            <div className="dash-detail-row">
              <span className="dash-detail-label">Team Size</span>
              {isEditingTeam ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="reg-count-group">
                    {[2, 3, 4, 5, 6].filter((n) => n >= minTeamSize).map((n) => {
                      const currentMemberCount = team?.members?.length || (user?.memberCount ? user.memberCount + 1 : 1);
                      const disabled = n < currentMemberCount;
                      return (
                        <button
                          key={n}
                          type="button"
                          className={`reg-count-btn ${editTeamSize === n ? 'reg-count-btn-active' : ''}`}
                          disabled={disabled}
                          onClick={() => setEditTeamSize(n)}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button type="button" onClick={handleSaveTeam} disabled={editTeamSubmitting} className="dash-save-btn">
                      {editTeamSubmitting ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setIsEditingTeam(false)} disabled={editTeamSubmitting} className="dash-cancel-btn">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <span className="dash-detail-value">
                  {team?.size ? `${team.members?.length || 1}/${team.size} spots filled` : `${user.memberCount} member${user.memberCount !== 1 ? 's' : ''} + leader`}
                </span>
              )}
            </div>
          )}
          {isEditingTeam && editTeamErr && (
            <div className="dash-detail-row">
              <span className="reg-error" style={{ marginLeft: 'auto' }}>{editTeamErr}</span>
            </div>
          )}

          {isLeader && team?.code && (
            <div className="dash-detail-row dash-detail-code-row">
              <span className="dash-detail-label">Invite Code</span>
              <div className="dash-code-wrap">
                <code className="dash-code">{team.code}</code>
                <button type="button" className="dash-code-copy" onClick={handleCopyCode}>
                  {codeCopied ? (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy</>
                  )}
                </button>
              </div>
            </div>
          )}
          {isLeader && team?.code && (
            <p className="dash-code-hint">Share this code with your teammates so they can join your team.</p>
          )}

          {/* These rows are always the signed-in participant's own details, so
              "Team Leader" only fits the leader - a member reading it sees
              their teammate's name under someone else's title. */}
          <div className="dash-detail-divider">
            {showTeam ? (isLeader ? 'Team Leader' : 'Your Info') : 'Personal Info'}
          </div>

          <div className="dash-details-grid">
            <div className="dash-detail-row">
              <span className="dash-detail-label">Full Name</span>
              <span className="dash-detail-value">{user.fullName}</span>
            </div>
            <div className="dash-detail-row">
              <span className="dash-detail-label">Email</span>
              <span className="dash-detail-value">{user.email}</span>
            </div>
            <div className="dash-detail-row">
              <span className="dash-detail-label">WhatsApp</span>
              <span className="dash-detail-value">{user.whatsapp}</span>
            </div>
            {user.university && (
              <div className="dash-detail-row">
                <span className="dash-detail-label">University / SB</span>
                <span className="dash-detail-value">{user.university}</span>
              </div>
            )}
            {user.facebookLink && (
              <div className="dash-detail-row">
                <span className="dash-detail-label">Facebook</span>
                <a
                  className="dash-detail-value"
                  href={user.facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {user.facebookLink.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}
            <div className="dash-detail-row">
              <span className="dash-detail-label">IEEE Member</span>
              <span className="dash-detail-value">{user.isIeee ? 'Yes' : 'No'}</span>
            </div>
            {user.isIeee && (
              <>
                <div className="dash-detail-row">
                  <span className="dash-detail-label">IEEE ID</span>
                  <span className="dash-detail-value">{user.ieeeId}</span>
                </div>
                <div className="dash-detail-row">
                  <span className="dash-detail-label">RAS Member</span>
                  <span className="dash-detail-value">{user.isRas ? 'Yes' : 'No'}</span>
                </div>
              </>
            )}
          </div>

          {/* Team Members (Challenger) */}
          {showTeam && teamMembers.length > 0 && (
            <>
              <button className="dash-members-toggle" onClick={() => setShowMembers((p) => !p)}>
                <span>Team Members ({teamMembers.length})</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showMembers ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <AnimatePresence>
                {showMembers && (
                  <motion.div
                    className="dash-members-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {teamMembers.map((m, i) => {
                      const memberIsLeader = m.isLeader || m.id === team?.leaderId;
                      return (
                      <div key={m.id} className="dash-member-mini">
                        <div className="dash-member-mini-header">
                          <span className="dash-member-mini-num">{String(i + 1).padStart(2, '0')}</span>
                          <span className="dash-member-mini-name">{`${m.name} ${m.lastName}`.trim()}</span>
                          {memberIsLeader && <span className="dash-member-leader-badge">Leader</span>}
                          {isLeader && !memberIsLeader && (
                            <button
                              type="button"
                              className="dash-member-remove"
                              onClick={() => handleRemoveMember(m.id)}
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
                  </motion.div>
                )}
              </AnimatePresence>

              {teamActionErr && (
                <span className="reg-error" style={{ display: 'block', marginTop: '10px' }}>{teamActionErr}</span>
              )}

              {isLeader && (
                <div className="dash-disband-row">
                  {confirmDisband ? (
                    <>
                      <span className="dash-disband-confirm-text">Disband this team? This cannot be undone.</span>
                      <div className="dash-disband-actions">
                        <button type="button" className="dash-disband-btn" onClick={handleDisbandTeam} disabled={disbanding}>
                          {disbanding ? 'Disbanding…' : 'Yes, disband'}
                        </button>
                        <button type="button" className="dash-cancel-btn" onClick={() => setConfirmDisband(false)} disabled={disbanding}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="dash-disband-btn" onClick={() => setConfirmDisband(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      Disband Team
                    </button>
                  )}
                </div>
              )}

              {!isLeader && (
                <div className="dash-disband-row">
                  {confirmLeave ? (
                    <>
                      <span className="dash-disband-confirm-text">Leave this team? You&apos;ll need a new invite to rejoin.</span>
                      <div className="dash-disband-actions">
                        <button type="button" className="dash-disband-btn" onClick={handleLeaveTeam} disabled={leaving}>
                          {leaving ? 'Leaving…' : 'Yes, leave'}
                        </button>
                        <button type="button" className="dash-cancel-btn" onClick={() => setConfirmLeave(false)} disabled={leaving}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="dash-disband-btn" onClick={() => setConfirmLeave(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      Leave Team
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
