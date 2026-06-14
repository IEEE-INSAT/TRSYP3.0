'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';

interface FormData {
  fullName: string;
  email: string;
  whatsapp: string;
  university: string;
  isIeee: boolean | null;
  ieeeId: string;
  isRas: boolean | null;
  password: string;
  confirmPassword: string;
  feeAgreed: boolean;
}

const initial: FormData = {
  fullName: '',
  email: '',
  whatsapp: '',
  university: '',
  isIeee: null,
  ieeeId: '',
  isRas: null,
  password: '',
  confirmPassword: '',
  feeAgreed: false,
};

export default function ParticipantForm() {
  const { registerParticipant, submitting } = useAuth();
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.whatsapp.trim()) e.whatsapp = 'Required';
    else if (!/^\+?\d{7,15}$/.test(form.whatsapp.replace(/[\s-]/g, '')))
      e.whatsapp = 'Invalid phone number';
    if (!form.university.trim()) e.university = 'Required';
    if (form.isIeee === null) e.isIeee = 'Select one';
    if (form.isIeee) {
      if (!form.ieeeId.trim()) e.ieeeId = 'Required';
      if (form.isRas === null) e.isRas = 'Select one';
    }
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Required';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.feeAgreed) e.feeAgreed = 'You must agree to proceed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    try {
      await registerParticipant({
        fullName: form.fullName,
        email: form.email,
        whatsapp: form.whatsapp,
        university: form.university,
        isIeee: form.isIeee === true,
        ieeeId: form.ieeeId,
        isRas: form.isRas === true,
        password: form.password,
      });
      setShowSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.',
      );
    }
  };

  const isComplete =
    form.fullName &&
    form.email &&
    form.whatsapp &&
    form.university &&
    form.isIeee !== null &&
    (form.isIeee === false || (form.ieeeId && form.isRas !== null)) &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword &&
    form.feeAgreed;

  return (
    <div className="reg-page">
      <div className="reg-container">
        <a href="/" className="reg-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </a>

        <motion.div
          className="reg-info-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="reg-info-badge">PARTICIPANT REGISTRATION</div>
          <h2 className="reg-info-title">TRSYP 3.0</h2>
          <p className="reg-info-subtitle">Tunisian Robotics Student &amp; Young Professionals Congress</p>
          <div className="reg-info-details">
            <div className="reg-info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              <span>October 17–18, 2026</span>
            </div>
            <div className="reg-info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span>Tunisia</span>
            </div>
            <div className="reg-info-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 2 17.5v0A2.5 2.5 0 0 1 4.5 15H7" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 22 17.5v0a2.5 2.5 0 0 0-2.5-2.5H17" /></svg>
              <span>Human-Robot Symbiosis</span>
            </div>
          </div>
          <div className="reg-info-fee">
            <strong>Registration fees:</strong> 30 TND for IEEE members / 50 TND for non-IEEE members.
            Fees cover access to all sessions, workshops, networking events, and meals.
          </div>
        </motion.div>

        <motion.form
          className="reg-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="reg-section-label">Personal Information</div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="fullName">Full Name *</label>
            <input id="fullName" className={`reg-input ${errors.fullName ? 'reg-input-error' : ''}`} type="text" placeholder="Enter your full name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            {errors.fullName && <span className="reg-error">{errors.fullName}</span>}
          </div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="email">Email Address *</label>
            <input id="email" className={`reg-input ${errors.email ? 'reg-input-error' : ''}`} type="email" placeholder="your.email@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
            {errors.email && <span className="reg-error">{errors.email}</span>}
          </div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="whatsapp">WhatsApp Number *</label>
            <input id="whatsapp" className={`reg-input ${errors.whatsapp ? 'reg-input-error' : ''}`} type="tel" placeholder="+216 XX XXX XXX" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            {errors.whatsapp && <span className="reg-error">{errors.whatsapp}</span>}
          </div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="university">University / Student Branch *</label>
            <input id="university" className={`reg-input ${errors.university ? 'reg-input-error' : ''}`} type="text" placeholder="e.g. INSAT, ENIT, ENSIT..." value={form.university} onChange={(e) => set('university', e.target.value)} />
            {errors.university && <span className="reg-error">{errors.university}</span>}
          </div>

          <div className="reg-section-label">IEEE Membership</div>

          <div className="reg-field">
            <label className="reg-label">Are you an IEEE member? *</label>
            <div className="reg-toggle-group">
              <button type="button" className={`reg-toggle ${form.isIeee === true ? 'reg-toggle-active-green' : ''}`} onClick={() => set('isIeee', true)}>Yes</button>
              <button type="button" className={`reg-toggle ${form.isIeee === false ? 'reg-toggle-active-pink' : ''}`} onClick={() => set('isIeee', false)}>No</button>
            </div>
            {errors.isIeee && <span className="reg-error">{errors.isIeee}</span>}
          </div>

          <AnimatePresence>
            {form.isIeee && (
              <motion.div className="reg-ieee-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <div className="reg-field">
                  <label className="reg-label" htmlFor="ieeeId">IEEE Member ID *</label>
                  <input id="ieeeId" className={`reg-input ${errors.ieeeId ? 'reg-input-error' : ''}`} type="text" placeholder="e.g. 12345678" value={form.ieeeId} onChange={(e) => set('ieeeId', e.target.value)} />
                  {errors.ieeeId && <span className="reg-error">{errors.ieeeId}</span>}
                </div>
                <div className="reg-field">
                  <label className="reg-label">Are you a RAS member? *</label>
                  <div className="reg-toggle-group">
                    <button type="button" className={`reg-toggle ${form.isRas === true ? 'reg-toggle-active-green' : ''}`} onClick={() => set('isRas', true)}>Yes</button>
                    <button type="button" className={`reg-toggle ${form.isRas === false ? 'reg-toggle-active-pink' : ''}`} onClick={() => set('isRas', false)}>No</button>
                  </div>
                  {errors.isRas && <span className="reg-error">{errors.isRas}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="reg-section-label">Create Your TRSYP 3.0 Account</div>
          <p className="reg-account-hint">You&apos;ll use this to access your dashboard and track your registration.</p>

          <div className="reg-field">
            <label className="reg-label" htmlFor="password">Password *</label>
            <div className="reg-pw-wrap">
              <input id="password" className={`reg-input ${errors.password ? 'reg-input-error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="Minimum 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
              <button type="button" className="reg-pw-toggle" onClick={() => setShowPw((p) => !p)} aria-label="Toggle password">
                {showPw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {errors.password && <span className="reg-error">{errors.password}</span>}
          </div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="confirmPassword">Confirm Password *</label>
            <div className="reg-pw-wrap">
              <input id="confirmPassword" className={`reg-input ${errors.confirmPassword ? 'reg-input-error' : ''}`} type={showCpw ? 'text' : 'password'} placeholder="Re-enter your password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
              <button type="button" className="reg-pw-toggle" onClick={() => setShowCpw((p) => !p)} aria-label="Toggle password">
                {showCpw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <span className="reg-error">{errors.confirmPassword}</span>}
          </div>

          <div className="reg-section-label">Confirmation</div>

          <label className="reg-checkbox-wrap">
            <input type="checkbox" checked={form.feeAgreed} onChange={(e) => set('feeAgreed', e.target.checked)} />
            <span className="reg-checkmark" />
            <span className="reg-checkbox-text">I confirm that I will pay the event registration fees before September 30, 2026.</span>
          </label>
          {errors.feeAgreed && <span className="reg-error" style={{ marginTop: '-8px' }}>{errors.feeAgreed}</span>}

          {submitError && <span className="reg-error">{submitError}</span>}

          <button type="submit" className="reg-submit" disabled={!isComplete || submitting}>
            {submitting ? 'Submitting…' : 'Submit Registration'}
          </button>
        </motion.form>
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
              <h2 className="reg-success-popup-title">Welcome to TRSYP 3.0!</h2>
              <p className="reg-success-popup-text">
                Thank you for registering as a participant! Your spot is reserved. To confirm your registration,
                please submit your payment proof before September 30, 2026. You can do this anytime from your dashboard.
              </p>
              <a href="/dashboard" className="reg-success-popup-btn">Go to My Dashboard</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
