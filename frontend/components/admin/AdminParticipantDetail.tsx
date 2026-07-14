'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import type { AdminStatus } from '@/lib/admin/types';
import { useToast } from './AdminToast';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  waiting_for_payment: { bg: '#f59e0b18', color: '#f59e0b', label: 'Waiting for Payment' },
  waiting_for_verification: { bg: '#3b82f618', color: '#3b82f6', label: 'Waiting for Verification' },
  approved: { bg: '#00E87A18', color: '#00E87A', label: 'Approved' },
  rejected: { bg: '#ef444418', color: '#ef4444', label: 'Rejected' },
};

export default function AdminParticipantDetail({ id }: { id: string }) {
  const loaded = useAdminStore((s) => s.loaded);
  const load = useAdminStore((s) => s.load);
  const p = useAdminStore((s) => s.participants.find((x) => x.id === id));
  const setParticipantStatus = useAdminStore((s) => s.setParticipantStatus);
  const deleteParticipant = useAdminStore((s) => s.deleteParticipant);
  const [showPw, setShowPw] = useState(false);
  const [confirm, setConfirm] = useState<{ action: string; title: string; msg: string; onConfirm: () => void } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  if (!loaded) return null;
  if (!p) return <div className="adm-list-page"><p style={{ color: '#888', padding: '2rem' }}>Participant not found.</p></div>;

  const updateStatus = (status: AdminStatus) => {
    void setParticipantStatus(id, status);
  };

  const handleApprove = () => {
    setConfirm({
      action: 'approve',
      title: 'Approve Registration',
      msg: `Approve ${p.fullName}'s registration?`,
      onConfirm: () => { updateStatus('approved'); toast('Registration approved!'); setConfirm(null); },
    });
  };

  const handleReject = () => {
    setConfirm({
      action: 'reject',
      title: 'Reject Registration',
      msg: `Reject ${p.fullName}'s registration? This will notify them.`,
      onConfirm: () => { updateStatus('rejected'); toast('Registration rejected', 'error'); setConfirm(null); },
    });
  };

  const handleDelete = () => {
    setConfirm({
      action: 'delete',
      title: 'Delete Registration',
      msg: `Permanently delete ${p.fullName}'s registration? This cannot be undone.`,
      onConfirm: () => {
        void deleteParticipant(id);
        toast('Registration deleted', 'info');
        window.location.href = '/admin/participants';
      },
    });
  };

  const st = STATUS_COLORS[p.status];

  return (
    <div className="adm-detail-page">
      <Link href="/admin/participants" className="adm-back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        Back to Participants
      </Link>

      <motion.div className="adm-detail-header" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="adm-detail-name">{p.fullName}</h1>
        <span className="adm-status-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
      </motion.div>

      {/* Registration data */}
      <motion.div className="adm-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <div className="adm-card-title">Registration Data</div>
        <div className="adm-detail-grid">
          <Row label="Full Name" value={p.fullName} />
          <Row label="Email" value={p.email} />
          <Row label="Password" value={showPw ? p.password : '••••••••'}>
            <button className="adm-pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? 'Hide' : 'Show'}</button>
          </Row>
          <Row label="WhatsApp" value={p.whatsapp} />
          <Row label="University / SB" value={p.university} />
          <Row label="IEEE Member" value={p.ieeeMember ? 'Yes' : 'No'} />
          <Row label="IEEE ID" value={p.ieeeId || 'N/A'} />
          <Row label="RAS Member" value={p.ieeeMember ? (p.rasMember ? 'Yes' : 'No') : 'N/A'} />
          <Row label="Registration Date" value={new Date(p.registeredAt).toLocaleString()} />
        </div>
      </motion.div>

      {/* Payment proof */}
      <motion.div className="adm-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <div className="adm-card-title">Payment Proof</div>
        {p.paymentProof ? (
          <div className="adm-payment-info">
            <div className="adm-payment-file">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              <span>{p.paymentProof}</span>
            </div>
            {p.paymentProofSubmittedAt && (
              <span className="adm-payment-date">Submitted on {new Date(p.paymentProofSubmittedAt).toLocaleString()}</span>
            )}
          </div>
        ) : (
          <p className="adm-no-proof">No payment proof submitted yet.</p>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div className="adm-actions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
        <button className="adm-action-btn adm-action-approve" onClick={handleApprove}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          Approve
        </button>
        <button className="adm-action-btn adm-action-reject" onClick={handleReject}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          Reject
        </button>
        <button className="adm-action-btn adm-action-delete" onClick={handleDelete}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          Delete
        </button>
      </motion.div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirm && (
          <motion.div className="adm-confirm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(null)}>
            <motion.div className="adm-confirm-dialog" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <h3 className="adm-confirm-title">{confirm.title}</h3>
              <p className="adm-confirm-msg">{confirm.msg}</p>
              <div className="adm-confirm-btns">
                <button className="adm-confirm-cancel" onClick={() => setConfirm(null)}>Cancel</button>
                <button className={`adm-confirm-ok adm-confirm-ok-${confirm.action}`} onClick={confirm.onConfirm}>Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="adm-detail-row">
      <span className="adm-detail-label">{label}</span>
      <span className="adm-detail-value">{value}{children}</span>
    </div>
  );
}
