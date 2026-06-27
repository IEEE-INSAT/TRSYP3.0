'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './AuthContext';

interface MemberData {
  name: string;
  email: string;
  whatsapp: string;
  university: string;
  isIeee: boolean | null;
  ieeeId: string;
  isRas: boolean | null;
}

interface FormData {
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  leaderWhatsapp: string;
  university: string;
  isIeee: boolean | null;
  ieeeId: string;
  isRas: boolean | null;
  memberCount: number;
  members: MemberData[];
  password: string;
  confirmPassword: string;
  feeAgreed: boolean;
}

const emptyMember = (): MemberData => ({
  name: '', email: '', whatsapp: '', university: '',
  isIeee: null, ieeeId: '', isRas: null,
});

const initial: FormData = {
  teamName: '',
  leaderName: '',
  leaderEmail: '',
  leaderWhatsapp: '',
  university: '',
  isIeee: null,
  ieeeId: '',
  isRas: null,
  memberCount: 0,
  members: [],
  password: '',
  confirmPassword: '',
  feeAgreed: false,
};

export default function ChallengerForm() {
  const { registerChallenger, submitting } = useAuth();
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const setMember = (idx: number, key: keyof MemberData, val: MemberData[keyof MemberData]) => {
    setForm((p) => {
      const members = [...p.members];
      members[idx] = { ...members[idx], [key]: val };
      return { ...p, members };
    });
  };

  const handleMemberCount = (count: number) => {
    const members = Array.from({ length: count }, (_, i) => form.members[i] || emptyMember());
    setForm((p) => ({ ...p, memberCount: count, members }));
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePhone = (p: string) => /^\+?\d{7,15}$/.test(p.replace(/[\s-]/g, ''));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.teamName.trim()) e.teamName = 'Required';
    if (!form.leaderName.trim()) e.leaderName = 'Required';
    if (!form.leaderEmail.trim()) e.leaderEmail = 'Required';
    else if (!validateEmail(form.leaderEmail)) e.leaderEmail = 'Invalid email';
    if (!form.leaderWhatsapp.trim()) e.leaderWhatsapp = 'Required';
    else if (!validatePhone(form.leaderWhatsapp)) e.leaderWhatsapp = 'Invalid phone';
    if (!form.university.trim()) e.university = 'Required';
    if (form.isIeee === null) e.isIeee = 'Select one';
    if (form.isIeee) {
      if (!form.ieeeId.trim()) e.ieeeId = 'Required';
      if (form.isRas === null) e.isRas = 'Select one';
    }
    if (form.memberCount === 0) e.memberCount = 'Select team size';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (!form.confirmPassword) e.confirmPassword = 'Required';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';

    form.members.forEach((m, i) => {
      if (!m.name.trim()) e[`m${i}_name`] = 'Required';
      if (!m.email.trim()) e[`m${i}_email`] = 'Required';
      else if (!validateEmail(m.email)) e[`m${i}_email`] = 'Invalid email';
      if (!m.whatsapp.trim()) e[`m${i}_whatsapp`] = 'Required';
      else if (!validatePhone(m.whatsapp)) e[`m${i}_whatsapp`] = 'Invalid phone';
      if (!m.university.trim()) e[`m${i}_university`] = 'Required';
      if (m.isIeee === null) e[`m${i}_isIeee`] = 'Select one';
      if (m.isIeee) {
        if (!m.ieeeId.trim()) e[`m${i}_ieeeId`] = 'Required';
        if (m.isRas === null) e[`m${i}_isRas`] = 'Select one';
      }
    });

    if (!form.feeAgreed) e.feeAgreed = 'You must agree to proceed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    try {
      await registerChallenger({
        fullName: form.leaderName,
        email: form.leaderEmail,
        whatsapp: form.leaderWhatsapp,
        university: form.university,
        isIeee: form.isIeee === true,
        ieeeId: form.ieeeId,
        isRas: form.isRas === true,
        password: form.password,
        teamName: form.teamName,
        memberCount: form.memberCount,
        members: form.members.map((m) => ({
          name: m.name,
          email: m.email,
          whatsapp: m.whatsapp,
          university: m.university,
          isIeee: m.isIeee === true,
          ieeeId: m.ieeeId,
          isRas: m.isRas === true,
        })),
      });
      setShowSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.',
      );
    }
  };

  const isComplete =
    form.teamName &&
    form.leaderName &&
    form.leaderEmail &&
    form.leaderWhatsapp &&
    form.university &&
    form.isIeee !== null &&
    (form.isIeee === false || (form.ieeeId && form.isRas !== null)) &&
    form.memberCount > 0 &&
    form.members.every(
      (m) =>
        m.name && m.email && m.whatsapp && m.university &&
        m.isIeee !== null &&
        (m.isIeee === false || (m.ieeeId && m.isRas !== null))
    ) &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword &&
    form.feeAgreed;

  const PwToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" className="reg-pw-toggle" onClick={onToggle} aria-label="Toggle password">
      {show ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      )}
    </button>
  );

  return (
    <div className="reg-page">
      <div className="reg-container">
        <a href="/" className="reg-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Home
        </a>

        <motion.div className="reg-info-banner reg-info-banner-pink" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="reg-info-badge reg-info-badge-pink">CHALLENGE REGISTRATION</div>
          <h2 className="reg-info-title">TRSYP 3.0 Robotics Challenge</h2>
          <p className="reg-info-subtitle">Compete in real-world robotics challenges — autonomous navigation, line-following, sumo bots, and more. Prove your engineering skills against the best teams in Tunisia.</p>
          <a href="/docs/challenge-specifications.pdf" target="_blank" rel="noopener noreferrer" className="reg-spec-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            Read Specification Book
          </a>
        </motion.div>

        <motion.form className="reg-form" onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <div className="reg-section-label">Team Information</div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="teamName">Team Name *</label>
            <input id="teamName" className={`reg-input ${errors.teamName ? 'reg-input-error' : ''}`} type="text" value={form.teamName} onChange={(e) => set('teamName', e.target.value)} />
            {errors.teamName && <span className="reg-error">{errors.teamName}</span>}
          </div>

          <div className="reg-section-label">Team Leader</div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="leaderName">Full Name *</label>
            <input id="leaderName" className={`reg-input ${errors.leaderName ? 'reg-input-error' : ''}`} type="text" value={form.leaderName} onChange={(e) => set('leaderName', e.target.value)} />
            {errors.leaderName && <span className="reg-error">{errors.leaderName}</span>}
          </div>

          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label" htmlFor="leaderEmail">Email Address *</label>
              <input id="leaderEmail" className={`reg-input ${errors.leaderEmail ? 'reg-input-error' : ''}`} type="email" value={form.leaderEmail} onChange={(e) => set('leaderEmail', e.target.value)} />
              {errors.leaderEmail && <span className="reg-error">{errors.leaderEmail}</span>}
            </div>
            <div className="reg-field">
              <label className="reg-label" htmlFor="leaderWhatsapp">WhatsApp Number *</label>
              <input id="leaderWhatsapp" className={`reg-input ${errors.leaderWhatsapp ? 'reg-input-error' : ''}`} type="tel" value={form.leaderWhatsapp} onChange={(e) => set('leaderWhatsapp', e.target.value)} />
              {errors.leaderWhatsapp && <span className="reg-error">{errors.leaderWhatsapp}</span>}
            </div>
          </div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="university">University / Student Branch *</label>
            <input id="university" className={`reg-input ${errors.university ? 'reg-input-error' : ''}`} type="text" value={form.university} onChange={(e) => set('university', e.target.value)} />
            {errors.university && <span className="reg-error">{errors.university}</span>}
          </div>

          <div className="reg-section-label">Leader IEEE Membership</div>

          <div className="reg-field">
            <label className="reg-label">Is the Team Leader an IEEE member? *</label>
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
                  <input id="ieeeId" className={`reg-input ${errors.ieeeId ? 'reg-input-error' : ''}`} type="text" value={form.ieeeId} onChange={(e) => set('ieeeId', e.target.value)} />
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

          <div className="reg-section-label">Team Members</div>

          <div className="reg-field">
            <label className="reg-label">How many members in your team? (excluding the leader) *</label>
            <div className="reg-count-group">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className={`reg-count-btn ${form.memberCount === n ? 'reg-count-btn-active' : ''}`} onClick={() => handleMemberCount(n)}>{n}</button>
              ))}
            </div>
            {errors.memberCount && <span className="reg-error">{errors.memberCount}</span>}
          </div>

          <AnimatePresence>
            {form.members.map((member, idx) => (
              <motion.div key={idx} className="reg-member-card" initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }}>
                <div className="reg-member-header">
                  <span className="reg-member-num">{String(idx + 1).padStart(2, '0')}</span>
                  <span>Team Member {idx + 1}</span>
                </div>

                <div className="reg-field">
                  <label className="reg-label">Name *</label>
                  <input className={`reg-input ${errors[`m${idx}_name`] ? 'reg-input-error' : ''}`} type="text" value={member.name} onChange={(e) => setMember(idx, 'name', e.target.value)} />
                  {errors[`m${idx}_name`] && <span className="reg-error">{errors[`m${idx}_name`]}</span>}
                </div>

                <div className="reg-row">
                  <div className="reg-field">
                    <label className="reg-label">Email *</label>
                    <input className={`reg-input ${errors[`m${idx}_email`] ? 'reg-input-error' : ''}`} type="email" value={member.email} onChange={(e) => setMember(idx, 'email', e.target.value)} />
                    {errors[`m${idx}_email`] && <span className="reg-error">{errors[`m${idx}_email`]}</span>}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">WhatsApp *</label>
                    <input className={`reg-input ${errors[`m${idx}_whatsapp`] ? 'reg-input-error' : ''}`} type="tel" value={member.whatsapp} onChange={(e) => setMember(idx, 'whatsapp', e.target.value)} />
                    {errors[`m${idx}_whatsapp`] && <span className="reg-error">{errors[`m${idx}_whatsapp`]}</span>}
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label">University / Student Branch *</label>
                  <input className={`reg-input ${errors[`m${idx}_university`] ? 'reg-input-error' : ''}`} type="text" value={member.university} onChange={(e) => setMember(idx, 'university', e.target.value)} />
                  {errors[`m${idx}_university`] && <span className="reg-error">{errors[`m${idx}_university`]}</span>}
                </div>

                <div className="reg-field">
                  <label className="reg-label">Is this member an IEEE member? *</label>
                  <div className="reg-toggle-group">
                    <button type="button" className={`reg-toggle ${member.isIeee === true ? 'reg-toggle-active-green' : ''}`} onClick={() => setMember(idx, 'isIeee', true)}>Yes</button>
                    <button type="button" className={`reg-toggle ${member.isIeee === false ? 'reg-toggle-active-pink' : ''}`} onClick={() => setMember(idx, 'isIeee', false)}>No</button>
                  </div>
                  {errors[`m${idx}_isIeee`] && <span className="reg-error">{errors[`m${idx}_isIeee`]}</span>}
                </div>

                <AnimatePresence>
                  {member.isIeee && (
                    <motion.div className="reg-ieee-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                      <div className="reg-field">
                        <label className="reg-label">IEEE Member ID *</label>
                        <input className={`reg-input ${errors[`m${idx}_ieeeId`] ? 'reg-input-error' : ''}`} type="text" value={member.ieeeId} onChange={(e) => setMember(idx, 'ieeeId', e.target.value)} />
                        {errors[`m${idx}_ieeeId`] && <span className="reg-error">{errors[`m${idx}_ieeeId`]}</span>}
                      </div>
                      <div className="reg-field">
                        <label className="reg-label">Are you a RAS member? *</label>
                        <div className="reg-toggle-group">
                          <button type="button" className={`reg-toggle ${member.isRas === true ? 'reg-toggle-active-green' : ''}`} onClick={() => setMember(idx, 'isRas', true)}>Yes</button>
                          <button type="button" className={`reg-toggle ${member.isRas === false ? 'reg-toggle-active-pink' : ''}`} onClick={() => setMember(idx, 'isRas', false)}>No</button>
                        </div>
                        {errors[`m${idx}_isRas`] && <span className="reg-error">{errors[`m${idx}_isRas`]}</span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="reg-section-label">Create Your TRSYP 3.0 Account</div>
          <p className="reg-account-hint">You&apos;ll use this to access your dashboard and track your registration.</p>

          <div className="reg-field">
            <label className="reg-label" htmlFor="pw">Password *</label>
            <div className="reg-pw-wrap">
              <input id="pw" className={`reg-input ${errors.password ? 'reg-input-error' : ''}`} type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} />
              <PwToggle show={showPw} onToggle={() => setShowPw((p) => !p)} />
            </div>
            {errors.password && <span className="reg-error">{errors.password}</span>}
          </div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="cpw">Confirm Password *</label>
            <div className="reg-pw-wrap">
              <input id="cpw" className={`reg-input ${errors.confirmPassword ? 'reg-input-error' : ''}`} type={showCpw ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
              <PwToggle show={showCpw} onToggle={() => setShowCpw((p) => !p)} />
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

          <button type="submit" className="reg-submit reg-submit-pink" disabled={!isComplete || submitting}>
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
                  <circle cx="30" cy="30" r="28" stroke="var(--color-pink)" strokeWidth="2.5" />
                  <path className="reg-check-path" d="M18 30l8 8 16-16" stroke="var(--color-pink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="reg-success-popup-title">Welcome to TRSYP 3.0!</h2>
              <p className="reg-success-popup-text">
                Thank you for registering your team for the TRSYP 3.0 Robotics Challenge! Your team is now in the system.
                To confirm your participation, please submit the total payment for your team before September 30, 2026 via your dashboard.
              </p>
              <a href="/dashboard" className="reg-success-popup-btn reg-success-popup-btn-pink">Go to My Dashboard</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
