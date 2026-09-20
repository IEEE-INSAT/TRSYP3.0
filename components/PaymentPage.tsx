'use client';

import { useState, useEffect, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/store/use-auth';
import { useTeamStore, useRegistrationStore, useAuthStore } from '@/lib/store';
import {
  FEES,
  FEE_CURRENCY,
  FEE_ROLE_LABELS,
  FEE_TIER_LABELS,
  computeFee,
  type FeeRole,
  type FeeTier,
} from '@/lib/fees';
import {
  ACCEPTED_PROOF_TYPES,
  MAX_PROOF_BYTES,
  OFFERED_PAYMENT_METHODS,
  PAYMENT_METHOD_HINTS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '@/lib/payment';

/**
 * Where the fee is sent, per method - shown once a method is picked.
 *
 * A list rather than one row each: a bank transfer needs both the RIB and the
 * IBAN, since a domestic transfer asks for one and an international one asks
 * for the other, and a participant should not have to convert between them.
 */
type MethodDetail = {
  label: string;
  value: string;
  /** Cash is an instruction, not an identifier - nothing to paste anywhere. */
  copyable?: boolean;
};

const METHOD_DETAILS: Record<PaymentMethod, MethodDetail[]> = {
  BANK_TRANSFER: [
    { label: 'RIB', value: '25 050 000 0099987808 42', copyable: true },
    { label: 'IBAN', value: 'TN59 25 050 000 0099987808 42', copyable: true },
  ],
  D17: [{ label: 'D17 number', value: '44 444 444', copyable: true }],
  FLOUCI: [{ label: 'Flouci number', value: '44 444 444', copyable: true }],
  CASH: [{ label: 'Where to pay', value: 'At the IEEE INSAT SB desk, INSAT campus' }],
};

const TIER_ORDER: FeeTier[] = ['IEEE_RAS', 'IEEE', 'NON_IEEE'];
const ROLE_ORDER: FeeRole[] = ['VISITOR', 'CHALLENGER'];

export default function PaymentPage() {
  const { user, submitPayment } = useAuth();
  // Teams are optional - a participant may hold a competition team, a challenge
  // team, both, or neither - so payment is not gated on team membership. The
  // teams decide the fee role (challenger vs visitor), so they are fetched here.
  const fetchTeams = useTeamStore((s) => s.fetchTeams);
  const teams = useTeamStore((s) => s.teams);
  // The server decides whether proofs are being accepted - it is the half
  // that enforces it, so there is no build-time flag here to disagree with.
  const submissionOpen = useRegistrationStore((s) => s.paymentSubmissionOpen);
  const hydrating = useRegistrationStore((s) => s.hydrating);
  const initialized = useAuthStore((s) => s.initialized);
  // A radio group with one option is not a choice. When only one method is
  // offered it is selected up front and the group is not rendered at all.
  const onlyMethod =
    OFFERED_PAYMENT_METHODS.length === 1 ? OFFERED_PAYMENT_METHODS[0] : null;
  const [method, setMethod] = useState<PaymentMethod | null>(onlyMethod);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) window.location.href = '/';
  }, [user]);

  useEffect(() => {
    if (user) void fetchTeams();
  }, [user, fetchTeams]);

  if (!user) return null;

  // Same three facts the server prices off, so the highlighted card tracks a
  // team join or a RAS toggle without waiting for a profile refetch.
  const isChallenger =
    user.userType === 'challenger' || !!teams.COMPETITION || !!teams.CHALLENGE;
  const myFee = computeFee({ isIeee: user.isIeee, isRas: user.isRas, isChallenger });

  // A rejected proof is still an open bill, so the form belongs to both
  // states - the only difference is the notice above it.
  const awaitingPayment =
    user.status === 'waiting_for_payment' || user.status === 'rejected';
  // Until the first sync answers, we do not know whether the window is open -
  // saying "soon" before asking would be a guess the participant then sees
  // flip under them.
  const windowKnown = initialized && !hydrating;
  const proofOpen = submissionOpen && awaitingPayment;

  // Cash would arrive without a receipt, but it is no longer offered - so in
  // practice the proof is always required. Kept as a condition rather than
  // hardcoded, so reopening cash needs no change here.
  const fileOptional = method === 'CASH';
  const canSubmit =
    !!method && confirmed && (!!file || fileOptional) && !uploading;

  const handleFile = (f: File) => {
    if (!ACCEPTED_PROOF_TYPES.includes(f.type)) return;
    if (f.size > MAX_PROOF_BYTES) return;
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

  const copyDetail = (detail: MethodDetail) => {
    // Strip the grouping spaces: they make a RIB readable on screen but a
    // bank form will usually refuse them.
    navigator.clipboard.writeText(detail.value.replace(/\s+/g, ''));
    setCopiedLabel(detail.label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setUploading(true);
    setSubmitError('');
    setProgress(0);
    try {
      await submitPayment(file, method, setProgress);
      setShowSuccess(true);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : 'Could not submit your payment proof',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="reg-page">
      <div className="reg-container">
        <Link href="/dashboard" className="reg-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </Link>

        {/* Instructions */}
        <motion.div className="reg-info-banner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="reg-info-badge">PAYMENT</div>
          <h2 className="reg-info-title">Registration Fee</h2>
          <p className="reg-info-subtitle">
            {proofOpen
              ? "You're one step away from confirming your registration for TRSYP 3.0!"
              : 'Here is what your registration costs. Proof submission opens shortly.'}
          </p>
          <div className="pay-steps">
            <div className="pay-step">
              <span className="pay-step-num">1</span>
              <span>Check the fee that applies to you : your card is highlighted below.</span>
            </div>
            <div className="pay-step">
              <span className="pay-step-num">2</span>
              <span>Transfer it to the account below.</span>
            </div>
            <div className="pay-step">
              <span className="pay-step-num">3</span>
              <span>Upload your receipt and we&apos;ll verify it within 48 hours.</span>
            </div>
          </div>
        </motion.div>

        {/* Fee cards - every tier, with the participant's own highlighted */}
        <motion.div className="pay-fees" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div className="pay-fees-head">
            <div className="pay-bank-title">Fees</div>
            <span className="pay-fees-yours">
              Your fee: <strong>{myFee.fee} {FEE_CURRENCY}</strong>
            </span>
          </div>

          {ROLE_ORDER.map((role) => (
            <div key={role} className="pay-fee-group">
              <div className="pay-fee-group-label">
                {FEE_ROLE_LABELS[role]}
                <span className="pay-fee-group-hint">
                  {role === 'CHALLENGER'
                    ? 'On a competition or technical challenge team'
                    : 'Attending without entering a track'}
                </span>
              </div>
              <div className="pay-fee-grid">
                {TIER_ORDER.map((tier) => {
                  const mine = role === myFee.feeRole && tier === myFee.feeTier;
                  return (
                    <div
                      key={tier}
                      className={`pay-fee-card ${mine ? 'pay-fee-card-mine' : ''}`}
                      aria-current={mine ? 'true' : undefined}
                    >
                      {mine && <span className="pay-fee-badge">Your fee</span>}
                      <span className="pay-fee-tier">{FEE_TIER_LABELS[tier]}</span>
                      <span className="pay-fee-amount">
                        {FEES[role][tier]}
                        <span className="pay-fee-currency">{FEE_CURRENCY}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Payment proof */}
        <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="reg-section-label">
            Payment Proof
            {windowKnown && !submissionOpen && awaitingPayment && (
              <span className="pay-soon-chip">Soon</span>
            )}
          </div>

          {!awaitingPayment ? (
            <p className="reg-account-hint">
              {user.status === 'waiting_for_verification'
                ? `We've received your payment proof${user.paymentFileName ? ` (${user.paymentFileName})` : ''} and our team is verifying it. Nothing else is needed from you.`
                : 'Your payment is confirmed - your spot at TRSYP 3.0 is secured.'}
            </p>
          ) : !windowKnown ? (
            <p className="reg-account-hint">Checking whether submission is open&hellip;</p>
          ) : !submissionOpen ? (
            <p className="reg-account-hint">
              Payment proof submission opens soon. We&apos;ll announce the accounts and turn this
              on here - no need to pay anything yet.
            </p>
          ) : (
            <>
              {/* Without this a rejected participant sees an empty form and no
                  idea what to change - the reason is the whole point of the
                  reviewer having typed one. */}
              {user.paymentRejectionReason && (
                <div className="pay-rejected" role="status">
                  <span className="pay-rejected-title">Your last proof was rejected</span>
                  <span className="pay-rejected-reason">{user.paymentRejectionReason}</span>
                  <span className="pay-rejected-hint">
                    Fix what&apos;s described above and submit again.
                  </span>
                </div>
              )}

              {!onlyMethod && (
              <div className="reg-field">
                <label className="reg-label">How did you pay?</label>
                <div className="pay-method-grid" role="radiogroup" aria-label="Payment method">
                  {OFFERED_PAYMENT_METHODS.map((m) => (
                    <label
                      key={m}
                      className={`pay-method ${method === m ? 'pay-method-active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={m}
                        checked={method === m}
                        onChange={() => { setMethod(m); setCopiedLabel(null); }}
                      />
                      <span className="pay-method-dot" />
                      <span className="pay-method-text">
                        <span className="pay-method-label">{PAYMENT_METHOD_LABELS[m]}</span>
                        <span className="pay-method-hint">{PAYMENT_METHOD_HINTS[m]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              )}

              {method && (
                <div className="pay-bank-card">
                  <div className="pay-bank-title">{PAYMENT_METHOD_LABELS[method]} Details</div>
                  <div className="pay-bank-rows">
                    <div className="pay-bank-row">
                      <span className="pay-bank-label">Account Holder</span>
                      <span className="pay-bank-value">STE SARRA OF CONGRESS AND EVENTS</span>
                    </div>
                    {METHOD_DETAILS[method].map((detail) => (
                      <div className="pay-bank-row" key={detail.label}>
                        <span className="pay-bank-label">{detail.label}</span>
                        <span className="pay-bank-value pay-bank-rib">
                          <code>{detail.value}</code>
                          {detail.copyable && (
                            <button
                              className="pay-copy-btn"
                              onClick={() => copyDetail(detail)}
                              type="button"
                              aria-label={`Copy ${detail.label}`}
                            >
                              {copiedLabel === detail.label ? (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
                              ) : (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy</>
                              )}
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                    <div className="pay-bank-row pay-bank-amount">
                      <span className="pay-bank-label">Amount</span>
                      <span className="pay-bank-value">
                        <strong>{myFee.fee} {FEE_CURRENCY}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

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
                      <Image
                        src={preview}
                        alt="Payment proof"
                        className="pay-file-thumb"
                        width={120}
                        height={80}
                        unoptimized
                      />
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
                    <p className="pay-dropzone-text">
                      {fileOptional
                        ? 'Attach a receipt if the committee gave you one'
                        : 'Drag & drop your receipt here'}
                    </p>
                    <p className="pay-dropzone-hint">
                      {fileOptional ? 'Optional for cash. ' : 'or click to browse: '}
                      JPG, PNG, PDF (max 3MB)
                    </p>
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
                  {fileOptional
                    ? `I confirm that I have paid the full registration fee of ${myFee.fee} ${FEE_CURRENCY} in cash to a member of the organizing committee.`
                    : `I confirm that I have paid the full registration fee of ${myFee.fee} ${FEE_CURRENCY}.`}
                </span>
              </label>

              {submitError && <p className="pay-submit-error">{submitError}</p>}

              <button
                type="button"
                className="reg-submit"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                {uploading ? `Uploading... ${Math.round(progress)}%` : 'Submit Payment Proof'}
              </button>
            </>
          )}
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
              <Link href="/dashboard" className="reg-success-popup-btn">Back to Dashboard</Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
