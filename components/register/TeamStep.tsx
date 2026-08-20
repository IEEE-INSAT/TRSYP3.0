'use client';

import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useTeamStore, selectTeam, selectRole } from '@/lib/store';
import { ACTIVITY_LABELS } from '@/lib/api/types';
import ActivityToggle, { isActivityOpen, phaseOf } from './ActivityToggle';

/** Page 2 of the registration flow - team leader / member + team status. */
export default function TeamStep() {
  const activity = useTeamStore((s) => s.activity);
  const setActivity = useTeamStore((s) => s.setActivity);
  const team = useTeamStore(selectTeam);
  const role = useTeamStore(selectRole);
  const loaded = useTeamStore((s) => s.loaded);
  const loading = useTeamStore((s) => s.loading);
  const submitting = useTeamStore((s) => s.submitting);
  const storeError = useTeamStore((s) => s.error);
  const fetchTeams = useTeamStore((s) => s.fetchTeams);
  const createTeam = useTeamStore((s) => s.createTeam);
  const joinTeam = useTeamStore((s) => s.joinTeam);
  const leaveTeam = useTeamStore((s) => s.leaveTeam);
  const disbandTeam = useTeamStore((s) => s.disbandTeam);
  const removeMember = useTeamStore((s) => s.removeMember);
  const clearError = useTeamStore((s) => s.clearError);

  const activityLabel = ACTIVITY_LABELS[activity];
  const activityOpen = isActivityOpen(activity);
  const minSize = activity === 'COMPETITION' ? 3 : 2;

  const [choice, setChoice] = useState<'leader' | 'member' | null>(null);
  const [teamName, setTeamName] = useState('');
  const [size, setSize] = useState(0);
  const [code, setCode] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canCreate = teamName.trim().length >= 2 && teamName.trim().length <= 50 && size >= minSize && size <= 6;
  const canJoin = code.trim().length === 6;

  useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    if (teamName.trim().length < 2 || teamName.trim().length > 50) {
      setFormErr('Team name must be 2–50 characters.');
      return;
    }
    if (size < minSize || size > 6) {
      setFormErr(`Team size must be between ${minSize} and 6.`);
      return;
    }
    try {
      await createTeam(teamName.trim(), size);
    } catch {
      /* error surfaced via storeError */
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    if (code.trim().length !== 6) {
      setFormErr('The team code is exactly 6 characters.');
      return;
    }
    try {
      await joinTeam(code.trim().toUpperCase());
    } catch {
      /* error surfaced via storeError */
    }
  };

  const copyCode = () => {
    if (!team?.code) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!loaded && loading) {
    return <div className="reg-form"><p className="reg-account-hint">Loading team…</p></div>;
  }

  // The activity switcher sits above every branch below so the user can always
  // hop between their competition and challenge teams. Switching clears the
  // half-filled form so a name typed for one track never lands on the other.
  const toggle = (
    <ActivityToggle
      value={activity}
      disabled={submitting}
      onChange={(next) => {
        setChoice(null);
        setTeamName('');
        setSize(0);
        setCode('');
        setFormErr(null);
        setActivity(next);
      }}
    />
  );

  // ── Team status panel (already in a team) ──────────────────────────────────
  if (team) {
    const isLeader = role === 'leader';
    return (
      <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {toggle}

        <div className="reg-section-label">Your {activityLabel} Team</div>

        <div className="dash-detail-row dash-detail-highlight">
          <span className="dash-detail-label">Team Name</span>
          <span className="dash-detail-value">{team.name}</span>
        </div>
        <div className="dash-detail-row">
          <span className="dash-detail-label">Role</span>
          <span className="dash-detail-value">{isLeader ? 'Leader' : 'Member'}</span>
        </div>

        {isLeader && team.code && (
          <div className="pay-bank-row" style={{ marginTop: '1rem' }}>
            <span className="pay-bank-label">Join Code</span>
            <span className="pay-bank-value pay-bank-rib">
              <code>{team.code}</code>
              <button className="pay-copy-btn" onClick={copyCode} type="button">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </span>
          </div>
        )}
        {isLeader && (
          <p className="reg-account-hint">Share this code with your teammates so they can join.</p>
        )}

        {/* Members */}
        <div className="reg-section-label">Members ({team.members.length})</div>
        <div className="dash-members-list">
        {team.members.map((m, index) => {
          const memberIsLeader = m.id === team.leaderId;
          return (
            <div key={m.id ?? index} className="dash-member-mini">
              <div className="dash-member-mini-header">
                <span className="dash-member-mini-name">
                  {m.name} {m.lastName}{memberIsLeader ? ' · Leader' : ''}
                </span>
                {isLeader && !memberIsLeader && (
                  <button
                    type="button"
                    className="reg-toggle"
                    style={{ padding: '2px 10px' }}
                    disabled={submitting}
                    onClick={() => void removeMember(m.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
              {m.email && <div className="dash-member-mini-details"><span>{m.email}</span></div>}
            </div>
          );
        })}
        </div>

        {storeError && <span className="reg-error">{storeError}</span>}

        <div className="reg-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          {isLeader ? (
            <button type="button" className="reg-submit reg-submit-pink" disabled={submitting} onClick={() => void disbandTeam()}>
              {submitting ? 'Working…' : 'Disband Team'}
            </button>
          ) : (
            <button type="button" className="reg-submit reg-submit-pink" disabled={submitting} onClick={() => void leaveTeam()}>
              {submitting ? 'Working…' : 'Leave Team'}
            </button>
          )}
          <Link href="/dashboard" className="reg-submit" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Window not open - nothing to create or join yet ────────────────────────
  if (!activityOpen) {
    return (
      <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {toggle}

        <div className="reg-section-label">{activityLabel}</div>
        <p className="reg-account-hint">
          {phaseOf(activity) === 'soon'
            ? `${activityLabel} team registration opens soon. Check back shortly - you can still register for the other track in the meantime.`
            : `${activityLabel} team registration is now closed.`}
        </p>
      </motion.div>
    );
  }

  // ── Leader / member choice + forms ─────────────────────────────────────────
  return (
    <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {toggle}

      <div className="reg-section-label">{activityLabel} Team</div>

      <div className="reg-field">
        <label className="reg-label">Are you a team leader?</label>
        <div className="reg-toggle-group">
          <button type="button" className={`reg-toggle ${choice === 'leader' ? 'reg-toggle-active-green' : ''}`} onClick={() => { setChoice('leader'); setFormErr(null); clearError(); }}>Yes, I&apos;m the leader</button>
          <button type="button" className={`reg-toggle ${choice === 'member' ? 'reg-toggle-active-pink' : ''}`} onClick={() => { setChoice('member'); setFormErr(null); clearError(); }}>No, I&apos;m joining</button>
        </div>
      </div>

      {choice === 'leader' && (
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
          <div className="reg-field">
            <label className="reg-label" htmlFor="teamName">Team Name *</label>
            <input id="teamName" className="reg-input" type="text" placeholder="Your team name" maxLength={50} required value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <div className="reg-field">
            <label className="reg-label">Team Size (including you) *</label>
            <div className="reg-count-group">
              {[2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" className={`reg-count-btn ${size === n ? 'reg-count-btn-active' : ''}`} disabled={n < minSize} onClick={() => setSize(n)}>{n}</button>
              ))}
            </div>
          </div>
          {(formErr || storeError) && <span className="reg-error">{formErr || storeError}</span>}
          <button type="submit" className="reg-submit" disabled={submitting || !canCreate}>
            {submitting ? 'Creating…' : 'Create Team'}
          </button>
        </form>
      )}

      {choice === 'member' && (
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
          <div className="reg-field">
            <label className="reg-label" htmlFor="code">Team Code *</label>
            <input
              id="code"
              className="reg-input"
              type="text"
              placeholder="6-character code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}
            />
          </div>
          {(formErr || storeError) && <span className="reg-error">{formErr || storeError}</span>}
          <button type="submit" className="reg-submit" disabled={submitting || !canJoin}>
            {submitting ? 'Joining…' : 'Join Team'}
          </button>
        </form>
      )}
    </motion.div>
  );
}
