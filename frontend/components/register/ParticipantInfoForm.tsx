'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRegistrationStore } from '@/lib/store';
import {
  COUNTRY_OPTIONS,
  DIAL_CODES,
  SB_OPTIONS,
  type Country,
  type Gender,
  type ParticipantType,
  type SB,
} from '@/lib/api/types';

const PARTICIPANT_TYPES: { value: ParticipantType; label: string }[] = [
  { value: 'NonIEEE', label: 'Non-IEEE' },
  { value: 'Student', label: 'Student' },
  { value: 'YoungProfessional', label: 'Young Professional' },
];

interface FormState {
  participantType: ParticipantType | null;
  gender: Gender | null;
  dialCode: string;
  phone: string;
  ieeeId: string;
  sb: SB | '';
  country: Country | '';
}

const initial: FormState = {
  participantType: null,
  gender: null,
  dialCode: DIAL_CODES[0].dial, // Tunisia (+216)
  phone: '',
  ieeeId: '',
  sb: '',
  country: '',
};

/** Page 1 of the registration flow — participant info (POST /registration). */
export default function ParticipantInfoForm({ onSuccess }: { onSuccess: () => void }) {
  const registerParticipant = useRegistrationStore((s) => s.registerParticipant);
  const submitting = useRegistrationStore((s) => s.submitting);

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const [isIeeeMember, setIsIeeeMember] = useState<boolean | null>(null);
  const isIeee = form.participantType === 'Student' || form.participantType === 'YoungProfessional';
  const isStudent = form.participantType === 'Student';

  // Local number digits only (drop spaces/dashes and any national trunk `0`),
  // then prepend the selected dial code to build the E.164 value.
  const localDigits = form.phone.replace(/[\s-]/g, '').replace(/^0+/, '');
  const fullPhone = `${form.dialCode}${localDigits}`;

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.participantType) e.participantType = 'Select one';
    if (!form.gender) e.gender = 'Select one';
    if (!localDigits) e.phone = 'Required';
    else if (!/^\d{4,14}$/.test(localDigits)) e.phone = 'Enter a valid phone number (digits only)';
    else if (!/^\+[1-9]\d{1,14}$/.test(fullPhone)) e.phone = 'Invalid phone number for this country code';
    if (isStudent && !form.sb) e.sb = 'Required for students';
    if (!form.country) e.country = 'Select your country';
    if (isIeee && !form.ieeeId.trim()) e.ieeeId = 'Required for IEEE members';
    else if (form.ieeeId && !/^\d+$/.test(form.ieeeId.trim())) e.ieeeId = 'Digits only';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    try {
      await registerParticipant({
        participantType: form.participantType as ParticipantType,
        gender: form.gender as Gender,
        phone: fullPhone,
        ieeeId: isIeee && form.ieeeId ? Number(form.ieeeId) : undefined,
        sb: isStudent && form.sb ? (form.sb as SB) : undefined,
        country: form.country as Country,
      });
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.',
      );
    }
  };

  const complete =
    !!form.participantType &&
    !!form.gender &&
    !!form.phone &&
    !!form.country &&
    (!isStudent || !!form.sb) &&
    (!isIeee || !!form.ieeeId.trim());

  return (
    <motion.form
      className="reg-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="reg-section-label">Participant Information</div>

      {/* IEEE Membership */}
      <div className="reg-field">
        <label className="reg-label">Are you an IEEE member? *</label>
        <div className="reg-toggle-group">
          <button
            type="button"
            className={`reg-toggle ${isIeeeMember === true ? 'reg-toggle-active-green' : ''}`}
            onClick={() => {
              setIsIeeeMember(true);
              set('participantType', null);
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className={`reg-toggle ${isIeeeMember === false ? 'reg-toggle-active-green' : ''}`}
            onClick={() => {
              setIsIeeeMember(false);
              set('participantType', 'NonIEEE');
              set('ieeeId', '');
              set('sb', '');
            }}
          >
            No
          </button>
        </div>
        {errors.participantType && <span className="reg-error">{errors.participantType}</span>}
      </div>

      {/* Gender */}
      <div className="reg-field">
        <label className="reg-label">Gender *</label>
        <div className="reg-toggle-group">
          <button type="button" className={`reg-toggle ${form.gender === 'male' ? 'reg-toggle-active-green' : ''}`} onClick={() => set('gender', 'male')}>Male</button>
          <button type="button" className={`reg-toggle ${form.gender === 'female' ? 'reg-toggle-active-pink' : ''}`} onClick={() => set('gender', 'female')}>Female</button>
        </div>
        {errors.gender && <span className="reg-error">{errors.gender}</span>}
      </div>

      {/* Phone */}
      <div className="reg-field">
        <label className="reg-label" htmlFor="phone">Phone Number *</label>
        <div className="reg-phone-group">
          <select
            aria-label="Country dial code"
            className={`reg-input reg-phone-dial ${errors.phone ? 'reg-input-error' : ''}`}
            value={form.dialCode}
            onChange={(e) => set('dialCode', e.target.value)}
          >
            {DIAL_CODES.map((c) => (
              <option key={c.label} value={c.dial}>
                {c.label} ({c.dial})
              </option>
            ))}
          </select>
          <input
            id="phone"
            className={`reg-input reg-phone-number ${errors.phone ? 'reg-input-error' : ''}`}
            type="tel"
            inputMode="tel"
            placeholder="12 345 678"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>
        {errors.phone && <span className="reg-error">{errors.phone}</span>}
      </div>

      {/* Country */}
      <div className="reg-field">
        <label className="reg-label" htmlFor="country">Country *</label>
        <select
          id="country"
          className={`reg-input ${errors.country ? 'reg-input-error' : ''}`}
          value={form.country}
          onChange={(e) => set('country', e.target.value as Country)}
        >
          <option value="">Select your country…</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.country && <span className="reg-error">{errors.country}</span>}
      </div>
      
      {/* Student vs Young Professional — IEEE members only */}
      <AnimatePresence>
        {isIeeeMember === true && (
          <motion.div
            className="reg-field"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="reg-label">Membership Type *</label>
            <div className="reg-toggle-group">
              <button
                type="button"
                className={`reg-toggle ${form.participantType === 'Student' ? 'reg-toggle-active-green' : ''}`}
                onClick={() => set('participantType', 'Student')}
              >
                Student
              </button>
              <button
                type="button"
                className={`reg-toggle ${form.participantType === 'YoungProfessional' ? 'reg-toggle-active-green' : ''}`}
                onClick={() => set('participantType', 'YoungProfessional')}
              >
                Young Professional
              </button>
            </div>
            {errors.participantType && <span className="reg-error">{errors.participantType}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* IEEE ID — IEEE members only */}
      <AnimatePresence>
        {isIeee && (
          <motion.div
            className="reg-field"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="reg-label" htmlFor="ieeeId">IEEE Member ID *</label>
            <input
              id="ieeeId"
              className={`reg-input ${errors.ieeeId ? 'reg-input-error' : ''}`}
              required
              type="text"
              inputMode="numeric"
              placeholder="e.g. 12345678"
              value={form.ieeeId}
              onChange={(e) => set('ieeeId', e.target.value)}
            />
            {errors.ieeeId && <span className="reg-error">{errors.ieeeId}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student branch — students only */}
      <AnimatePresence>
        {isStudent && (
          <motion.div
            className="reg-field"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="reg-label" htmlFor="sb">Student Branch *</label>
            <select
              id="sb"
              className={`reg-input ${errors.sb ? 'reg-input-error' : ''}`}
              value={form.sb}
              onChange={(e) => set('sb', e.target.value as SB)}
            >
              <option value="">Select your student branch…</option>
              {SB_OPTIONS.map((sb) => (
                <option key={sb} value={sb}>{sb}</option>
              ))}
            </select>
            {errors.sb && <span className="reg-error">{errors.sb}</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {submitError && <span className="reg-error">{submitError}</span>}

      <button type="submit" className="reg-submit" disabled={!complete || submitting}>
        {submitting ? 'Saving…' : 'Continue'}
      </button>
    </motion.form>
  );
}
