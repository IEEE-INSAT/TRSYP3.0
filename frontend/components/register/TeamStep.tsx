'use client';

import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { useTeamStore } from '@/lib/store';

/** Page 2 of the registration flow — team leader / member + team status. */
export default function TeamStep() {
  const team = useTeamStore((s) => s.team);
  const role = useTeamStore((s) => s.role);
  const loaded = useTeamStore((s) => s.loaded);
  const loading = useTeamStore((s) => s.loading);
  const submitting = useTeamStore((s) => s.submitting);
  const storeError = useTeamStore((s) => s.error);
  const fetchTeam = useTeamStore((s) => s.fetchTeam);
  const createTeam = useTeamStore((s) => s.createTeam);
  const joinTeam = useTeamStore((s) => s.joinTeam);
  const leaveTeam = useTeamStore((s) => s.leaveTeam);
  const disbandTeam = useTeamStore((s) => s.disbandTeam);
  const removeMember = useTeamStore((s) => s.removeMember);

  const [choice, setChoice] = useState<'leader' | 'member' | null>(null);
  const [teamName, setTeamName] = useState('');
  const [size, setSize] = useState(0);
  const [code, setCode] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void fetchTeam();
  }, [fetchTeam]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    if (teamName.trim().length < 2 || teamName.trim().length > 50) {
      setFormErr('Team name must be 2–50 characters.');
      return;
    }
    if (size < 1 || size > 6) {
      setFormErr('Team size must be between 1 and 6.');
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

  // ── Team status panel (already in a team) ──────────────────────────────────
  if (team) {
    const isLeader = role === 'leader';
    return (
      <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="reg-section-label">Your Team</div>

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
          <a href="/dashboard" className="reg-submit" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Go to Dashboard
          </a>
        </div>
      </motion.div>
    );
  }

  // ── Leader / member choice + forms ─────────────────────────────────────────
  return (
    <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="reg-section-label">Team</div>

      <div className="reg-field">
        <label className="reg-label">Are you a team leader?</label>
        <div className="reg-toggle-group">
          <button type="button" className={`reg-toggle ${choice === 'leader' ? 'reg-toggle-active-green' : ''}`} onClick={() => { setChoice('leader'); setFormErr(null); }}>Yes, I&apos;m the leader</button>
          <button type="button" className={`reg-toggle ${choice === 'member' ? 'reg-toggle-active-pink' : ''}`} onClick={() => { setChoice('member'); setFormErr(null); }}>No, I&apos;m joining</button>
        </div>
      </div>

      {choice === 'leader' && (
        <form onSubmit={handleCreate}>
          <div className="reg-field">
            <label className="reg-label" htmlFor="teamName">Team Name *</label>
            <input id="teamName" className="reg-input" type="text" placeholder="Your team name" maxLength={50} value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </div>
          <div className="reg-field">
            <label className="reg-label">Team Size (including you) *</label>
            <div className="reg-count-group">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" className={`reg-count-btn ${size === n ? 'reg-count-btn-active' : ''}`} onClick={() => setSize(n)}>{n}</button>
              ))}
            </div>
          </div>
          {(formErr || storeError) && <span className="reg-error">{formErr || storeError}</span>}
          <button type="submit" className="reg-submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Team'}
          </button>
        </form>
      )}

      {choice === 'member' && (
        <form onSubmit={handleJoin}>
          <div className="reg-field">
            <label className="reg-label" htmlFor="code">Team Code *</label>
            <input
              id="code"
              className="reg-input"
              type="text"
              placeholder="6-character code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}
            />
          </div>
          {(formErr || storeError) && <span className="reg-error">{formErr || storeError}</span>}
          <button type="submit" className="reg-submit" disabled={submitting}>
            {submitting ? 'Joining…' : 'Join Team'}
          </button>
        </form>
      )}
    </motion.div>
  );
}
