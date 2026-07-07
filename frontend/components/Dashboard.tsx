'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { useTeamStore, useRegistrationStore } from '@/lib/store';

const STATUS_MAP = {
  waiting_for_payment: { label: 'Waiting for Payment', color: '#f59e0b', icon: '🟡', msg: 'Your registration is pending. Please submit your payment proof to confirm your spot.' },
  waiting_for_verification: { label: 'Waiting for Verification', color: '#3b82f6', icon: '🔵', msg: 'Your payment proof has been submitted and is under review. We\'ll notify you once verified.' },
  approved: { label: 'Approved', color: '#00E87A', icon: '🟢', msg: 'Your registration is confirmed! See you at TRSYP 3.0!' },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showMembers, setShowMembers] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const team = useTeamStore((s) => s.team);
  const role = useTeamStore((s) => s.role);
  const updateTeam = useTeamStore((s) => s.updateTeam);
  const fetchTeam = useTeamStore((s) => s.fetchTeam);
  const hydrateFromBackend = useRegistrationStore((s) => s.hydrateFromBackend);

  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamSize, setEditTeamSize] = useState(1);
  const [editTeamErr, setEditTeamErr] = useState('');
  const [editTeamSubmitting, setEditTeamSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setRedirecting(true);
      window.location.href = '/';
    }
  }, [user]);

  if (!user || redirecting) return null;

  const status = STATUS_MAP[user.status];

  useEffect(() => {
    if (user && !team) {
      void fetchTeam();
    }
  }, [user, team, fetchTeam]);

  const isChallenger = user.userType === 'challenger' || !!team;

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
    const currentMemberCount = team?.members?.length || 1;
    if (editTeamSize < currentMemberCount || editTeamSize > 6) {
      setEditTeamErr(`Team size must be between ${currentMemberCount} and 6.`);
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

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
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
          <button className="dash-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
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

          {/* Payment Action */}
          {user.status === 'waiting_for_payment' && (
            <a href="/dashboard/payment" className="dash-pay-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              Submit Payment Proof
            </a>
          )}
          {user.status === 'waiting_for_verification' && (
            <div className="dash-pay-submitted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <div>
                <span>Payment Proof Submitted — Under Review</span>
                {user.paymentFileName && <span className="dash-pay-file">{user.paymentFileName}</span>}
              </div>
            </div>
          )}
          {user.status === 'approved' && (
            <div className="dash-pay-approved">Registration Confirmed</div>
          )}
        </motion.div>

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
                  {role === 'leader' && (
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
                  <input type="number" min={team?.members?.length || 1} max="6" className="dash-edit-input" value={editTeamSize} onChange={(e) => setEditTeamSize(parseInt(e.target.value) || 1)} style={{ width: '70px', textAlign: 'center' }} />
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
            <div className="dash-detail-row">
              <span className="dash-detail-label">University / SB</span>
              <span className="dash-detail-value">{user.university}</span>
            </div>
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
          {isChallenger && user.members && user.members.length > 0 && (
            <>
              <button className="dash-members-toggle" onClick={() => setShowMembers((p) => !p)}>
                <span>Team Members ({user.members.length})</span>
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
                    {user.members.map((m, i) => (
                      <div key={i} className="dash-member-mini">
                        <div className="dash-member-mini-header">
                          <span className="dash-member-mini-num">{String(i + 1).padStart(2, '0')}</span>
                          <span className="dash-member-mini-name">{m.name}</span>
                        </div>
                        <div className="dash-member-mini-details">
                          <span>{m.email}</span>
                          <span>{m.whatsapp}</span>
                          <span>{m.university}</span>
                          <span>IEEE: {m.isIeee ? `Yes (${m.ieeeId})` : 'No'}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
