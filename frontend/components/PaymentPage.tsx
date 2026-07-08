'use client';

import { useState, useEffect, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';
import { useTeamStore } from '@/lib/store';

export default function PaymentPage() {
  const { user, submitPayment } = useAuth();
  const team = useTeamStore((s) => s.team);
  const teamLoaded = useTeamStore((s) => s.loaded);
  const fetchTeam = useTeamStore((s) => s.fetchTeam);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.status !== 'waiting_for_payment') {
      window.location.href = user ? '/dashboard' : '/';
    }
  }, [user]);

  // Payment is gated behind team membership — a team-less challenger must
  // (re)join or create a team first. Bounce them back to the dashboard.
  useEffect(() => {
    if (user) void fetchTeam();
  }, [user?.participantId, fetchTeam]);

  useEffect(() => {
    if (user && teamLoaded && !team) {
      window.location.href = '/dashboard';
    }
  }, [user, teamLoaded, team]);

  if (!user || user.status !== 'waiting_for_payment') return null;
  if (teamLoaded && !team) return null;

  const isChallenger = user.userType === 'challenger';
  const feeAmount = user.isIeee ? 30 : 50;
  const totalAmount = isChallenger ? feeAmount * ((user.memberCount || 0) + 1) : feeAmount;

  const handleFile = (f: File) => {
    const valid = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!valid.includes(f.type)) return;
    if (f.size > 5 * 1024 * 1024) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const copyRib = () => {
    navigator.clipboard.writeText('44444444444444444444');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
    if (!file || !confirmed) return;
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          submitPayment(file.name);
          setUploading(false);
          setShowSuccess(true);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 150);
  };

  return (
    <div className="reg-page">
      <div className="reg-container">
        <a href="/dashboard" className="reg-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </a>

        {/* Instructions */}
        <motion.div className="reg-info-banner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="reg-info-badge">PAYMENT SUBMISSION</div>
          <h2 className="reg-info-title">Submit Your Payment</h2>
          <p className="reg-info-subtitle">You&apos;re one step away from confirming your registration for TRSYP 3.0!</p>
          <div className="pay-steps">
            <div className="pay-step">
              <span className="pay-step-num">1</span>
              <span>Transfer the registration fee to the account below.</span>
            </div>
            <div className="pay-step">
              <span className="pay-step-num">2</span>
              <span>Upload your payment receipt (screenshot, photo, or PDF).</span>
            </div>
            <div className="pay-step">
              <span className="pay-step-num">3</span>
              <span>Submit and we&apos;ll verify your payment within 48 hours.</span>
            </div>
          </div>
        </motion.div>

        {/* Bank Details */}
        <motion.div className="pay-bank-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="pay-bank-title">Payment Details</div>
          <div className="pay-bank-rows">
            <div className="pay-bank-row">
              <span className="pay-bank-label">Bank</span>
              <span className="pay-bank-value">Bank Name (Placeholder)</span>
            </div>
            <div className="pay-bank-row">
              <span className="pay-bank-label">Account Holder</span>
              <span className="pay-bank-value">TRSYP 3.0 Organizing Committee</span>
            </div>
            <div className="pay-bank-row">
              <span className="pay-bank-label">RIB Number</span>
              <span className="pay-bank-value pay-bank-rib">
                <code>44444444444444444444</code>
                <button className="pay-copy-btn" onClick={copyRib} type="button">
                  {copied ? (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy</>
                  )}
                </button>
              </span>
            </div>
            <div className="pay-bank-row pay-bank-amount">
              <span className="pay-bank-label">Amount</span>
              <span className="pay-bank-value">
                <strong>{totalAmount} TND</strong>
                {isChallenger && <span className="pay-bank-note">({(user.memberCount || 0) + 1} members × {feeAmount} TND)</span>}
              </span>
            </div>
          </div>
          {isChallenger && (
            <p className="pay-bank-team-note">Please transfer the total amount for your entire team in a single transaction.</p>
          )}
        </motion.div>

        {/* Upload */}
        <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="reg-section-label">Upload Payment Proof</div>

          <div
            className={`pay-dropzone ${dragging ? 'pay-dropzone-active' : ''} ${file ? 'pay-dropzone-has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="pay-file-preview">
                {preview ? (
                  <img src={preview} alt="Payment proof" className="pay-file-thumb" />
                ) : (
                  <div className="pay-file-pdf-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  </div>
                )}
                <div className="pay-file-info">
                  <span className="pay-file-name">{file.name}</span>
                  <span className="pay-file-size">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
                <button
                  className="pay-file-remove"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  type="button"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ) : (
              <>
                <svg className="pay-dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <p className="pay-dropzone-text">Drag & drop your receipt here</p>
                <p className="pay-dropzone-hint">or click to browse — JPG, PNG, PDF (max 5MB)</p>
              </>
            )}
          </div>

          {uploading && (
            <div className="pay-progress">
              <div className="pay-progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          )}

          <label className="reg-checkbox-wrap">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span className="reg-checkmark" />
            <span className="reg-checkbox-text">
              I confirm that I have transferred the full registration fee of {totalAmount} TND to the account above.
            </span>
          </label>

          <button
            type="button"
            className="reg-submit"
            disabled={!file || !confirmed || uploading}
            onClick={handleSubmit}
          >
            {uploading ? 'Uploading...' : 'Submit Payment Proof'}
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div className="reg-overlay reg-overlay-nodismiss" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="reg-popup reg-success-popup" initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}>
              <div className="reg-success-anim">
                <svg className="reg-success-check" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="28" stroke="var(--color-green)" strokeWidth="2.5" />
                  <path className="reg-check-path" d="M18 30l8 8 16-16" stroke="var(--color-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="reg-success-popup-title">Payment Proof Submitted!</h2>
              <p className="reg-success-popup-text">
                Thank you! Your payment proof has been received. Our team will verify it within 48 hours.
                You can track your status from your dashboard.
              </p>
              <a href="/dashboard" className="reg-success-popup-btn">Back to Dashboard</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
