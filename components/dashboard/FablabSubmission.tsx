'use client';

import { useState, FormEvent } from 'react';
import { useTeamStore } from '@/lib/store';
import { fablabChallenge } from '@/lib/config';
import { isGoogleDriveUrl } from '@/lib/utils';
import { fablabAxisLabel, type Team } from '@/lib/api/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Fablab concept submission, inside the dashboard's Fablab card.
 * Everyone on the team sees the status; only the leader can submit or replace
 * the link, and only while the submission window is open. The server enforces
 * both - this only decides what to offer.
 */
export default function FablabSubmission({ team, isLeader }: { team: Team; isLeader: boolean }) {
  const submitFablab = useTeamStore((s) => s.submitFablab);
  const [url, setUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const phase = fablabChallenge.submissionPhase;
  const submitted = !!team.submissionUrl;
  const canSubmit = isLeader && phase === 'open';
  const showForm = canSubmit && (!submitted || editing);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isGoogleDriveUrl(url)) {
      setError('Paste a Google Drive link (https://drive.google.com/...).');
      return;
    }
    setSubmitting(true);
    try {
      await submitFablab(url.trim());
      setEditing(false);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fablab-sub">
      <div className="fablab-sub-team">
        <span>{team.name}</span>
        {team.axis && <span className="fablab-sub-axis">{fablabAxisLabel(team.axis)}</span>}
      </div>

      {submitted ? (
        <div className="fablab-sub-status fablab-sub-status--done">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          <div>
            <strong>Concept submitted</strong>
            {team.submittedAt && <span> · {formatDate(team.submittedAt)}</span>}
            <a href={team.submissionUrl!} target="_blank" rel="noopener noreferrer" className="fablab-sub-link">
              Open the Drive folder
            </a>
          </div>
        </div>
      ) : (
        <div className="fablab-sub-status">
          <strong>Concept not submitted yet.</strong>{' '}
          {isLeader ? 'Submit your Drive folder below.' : 'Your team leader submits it from their dashboard.'}
        </div>
      )}

      {phase === 'soon' && <p className="fablab-sub-note">Submissions open soon.</p>}
      {phase === 'closed' && <p className="fablab-sub-note">Submissions are closed.</p>}

      {canSubmit && submitted && !editing && (
        <button type="button" className="dash-cancel-btn" onClick={() => setEditing(true)}>
          Replace the link
        </button>
      )}

      {showForm && (
        <form className="fablab-sub-form" onSubmit={handleSubmit}>
          <label className="reg-label" htmlFor="fablab-drive-url">Google Drive folder link *</label>
          <input
            id="fablab-drive-url"
            type="url"
            className={`dash-edit-input${error ? ' reg-input-error' : ''}`}
            placeholder="https://drive.google.com/drive/folders/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={submitting}
          />
          <p className="fablab-sub-note">
            One folder named with your team name, shared as <strong>&ldquo;Anyone with the link can
            view&rdquo;</strong> - we cannot open private folders. It must hold your concept dossier (PDF,
            max 3 pages).
          </p>
          {error && <span className="reg-error">{error}</span>}
          <div className="dash-noteam-form-actions">
            <button type="submit" className="dash-save-btn" disabled={submitting || !url.trim()}>
              {submitting ? 'Submitting…' : submitted ? 'Replace' : 'Submit'}
            </button>
            {editing && (
              <button
                type="button"
                className="dash-cancel-btn"
                onClick={() => { setEditing(false); setError(''); setUrl(''); }}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
