'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { useTeamStore, useRegistrationStore } from '@/lib/store';

// TEMP: payment step disabled for now — flip back to true to re-enable.
// (Keeps the "Submit Payment Proof" button/code intact, just hidden.)
const PAYMENT_ENABLED = false;

const STATUS_MAP = {
  waiting_for_payment: { label: 'Waiting for Payment', color: '#f59e0b', icon: '🟡', msg: 'Your registration is pending. Please submit your payment proof to confirm your spot.' },
  waiting_for_verification: { label: 'Waiting for Verification', color: '#3b82f6', icon: '🔵', msg: 'Your payment proof has been submitted and is under review. We\'ll notify you once verified.' },
  approved: { label: 'Approved', color: '#00E87A', icon: '🟢', msg: 'Your registration is confirmed! See you at TRSYP 3.0!' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [showMembers, setShowMembers] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const team = useTeamStore((s) => s.team);
  const role = useTeamStore((s) => s.role);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const updateTeam = useTeamStore((s) => s.updateTeam);
  const fetchTeam = useTeamStore((s) => s.fetchTeam);
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
    if (!user) {
      setRedirecting(true);
      window.location.href = '/';
    }
  }, [user]);

  if (!user || redirecting) return null;

  const status = STATUS_MAP[user.status];

  // Fetch (and refresh) the team whenever the signed-in participant is known.
  // Re-running when `participantId` resolves also re-syncs `role`, which is what
  // makes the leader-only Edit button appear reliably instead of racing the
  // profile hydration.
  useEffect(() => {
    if (user) void fetchTeam();
  }, [user?.participantId, fetchTeam]);

  const isChallenger = user.userType === 'challenger' || !!team;

  // A registered user with no team must (re)join or create one before they can
  // continue (e.g. after being kicked or leaving). Gate on `teamLoaded` so this
  // doesn't flash while the team is still being fetched.
  const needsTeam = teamLoaded && !team;

  // Derive leader status at render time so it self-corrects once both the team
  // and the participant id have loaded — the persisted `role` snapshot can be
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
    const currentSize = team?.size || (user?.memberCount ? user.memberCount + 1 : 1);
    if (editTeamSize < currentSize || editTeamSize > 6) {
      setEditTeamErr(`Team size can only be increased (min ${currentSize}, max 6).`);
      return;
    }

    setEditTeamSubmitting(true);
    try {
      await updateTeam(editTeamName.trim(), editTeamSize);
      await hydrateFromBackend();
      setIsEditingTeam(false);
    } catch (e: any) {
      setEditTeamErr(e.message || 'Failed to update team');
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
    } catch (e: any) {
      setTeamActionErr(e.message || 'Failed to remove member');
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
    } catch (e: any) {
      setTeamActionErr(e.message || 'Failed to disband team');
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
    } catch (e: any) {
      setTeamActionErr(e.message || 'Failed to leave team');
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
    } catch (e: any) {
      setNoTeamErr(e.message || 'Failed to join team');
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
    if (newTeamSize < 1 || newTeamSize > 6) {
      setNoTeamErr('Team size must be between 1 and 6.');
      return;
    }
    setNoTeamSubmitting(true);
    try {
      await createTeam(newTeamName.trim(), newTeamSize);
      await hydrateFromBackend();
      setTeamMode('none');
      setNewTeamName('');
    } catch (e: any) {
      setNoTeamErr(e.message || 'Failed to create team');
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
              Welcome back, {isChallenger ? `Team ${team?.name || user.teamName || 'Member'}` : user.fullName}!
            </h1>
            <span className={`dash-type-badge ${isChallenger ? 'dash-type-challenger' : 'dash-type-participant'}`}>
              {isChallenger ? 'Challenger' : 'Participant'}
            </span>
          </div>
        </motion.div>

        {/* Status Card */}
        <motion.div className="dash-card dash-status-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ borderColor: `${status.color}22` }}>
          <div className="dash-card-title">Registration Status</div>
          <div className="dash-status-row">
            <span className="dash-status-badge" style={{ background: `${status.color}18`, color: status.color, borderColor: `${status.color}33` }}>
              {status.icon} {status.label}
            </span>
          </div>
          <p className="dash-status-msg">{status.msg}</p>

          {/* Payment Action (TEMP: hidden while PAYMENT_ENABLED = false) */}
          {PAYMENT_ENABLED && user.status === 'waiting_for_payment' && (
            <a href="/dashboard/payment" className="dash-pay-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              Submit Payment Proof
            </a>
          )}
          {PAYMENT_ENABLED && user.status === 'waiting_for_payment' && needsTeam && (
            <div className="dash-pay-locked">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Join or create a team to unlock payment.
            </div>
          )}
          {PAYMENT_ENABLED && user.status === 'waiting_for_verification' && (
            <div className="dash-pay-submitted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <div>
                <span>Payment Proof Submitted — Under Review</span>
                {user.paymentFileName && <span className="dash-pay-file">{user.paymentFileName}</span>}
              </div>
            </div>
          )}
          {PAYMENT_ENABLED && user.status === 'approved' && (
            <div className="dash-pay-approved">Registration Confirmed</div>
          )}
        </motion.div>

        {/* No team yet — (re)join or create one */}
        {needsTeam && (
          <motion.div className="dash-card dash-noteam-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <div className="dash-card-title">Your Team</div>
            <p className="dash-noteam-msg">
              You&apos;re not part of a team yet. Every challenger competes as a team — join one with a code, or create your own and invite members.
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
                <input
                  className="dash-edit-input"
                  placeholder="Team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <div className="dash-noteam-form-actions">
                  <label className="dash-noteam-size">
                    Team size
                    <input type="number" min={1} max={6} className="dash-edit-input" value={newTeamSize} onChange={(e) => setNewTeamSize(parseInt(e.target.value) || 1)} style={{ width: '70px', textAlign: 'center' }} />
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button type="button" className="dash-save-btn" onClick={handleCreateTeam} disabled={noTeamSubmitting}>
                      {noTeamSubmitting ? 'Creating…' : 'Create'}
                    </button>
                    <button type="button" className="dash-cancel-btn" onClick={() => { setTeamMode('none'); setNoTeamErr(''); }} disabled={noTeamSubmitting}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {noTeamErr && <span className="reg-error" style={{ display: 'block', marginTop: '12px' }}>{noTeamErr}</span>}
          </motion.div>
        )}

        {/* Registration Details */}
        <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="dash-card-title">Registration Details</div>

          {isChallenger && (
            <div className="dash-detail-row dash-detail-highlight" style={{ alignItems: isEditingTeam ? 'center' : 'flex-start' }}>
              <span className="dash-detail-label">Team Name</span>
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
          {isChallenger && (
            <div className="dash-detail-row">
              <span className="dash-detail-label">Team Size</span>
              {isEditingTeam ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
                  <input type="number" min={team?.size || (user?.memberCount ? user.memberCount + 1 : 1)} max="6" className="dash-edit-input" value={editTeamSize} onChange={(e) => setEditTeamSize(parseInt(e.target.value) || 1)} style={{ width: '70px', textAlign: 'center' }} />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>members total</span>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
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

          <div className="dash-detail-divider">{isChallenger ? 'Team Leader' : 'Personal Info'}</div>

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
          {isChallenger && teamMembers.length > 0 && (
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
