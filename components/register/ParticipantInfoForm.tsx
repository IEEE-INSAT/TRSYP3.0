'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRegistrationStore } from '@/lib/store';
import { ieeeMemberNumberError, isFacebookUrl } from '@/lib/utils';
import {
  COUNTRY_OPTIONS,
  DIAL_CODES,
  SB_OPTIONS,
  type CareerStage,
  type Country,
  type Gender,
  type SB,
} from '@/lib/api/types';

interface FormState {
  careerStage: CareerStage | null;
  gender: Gender | null;
  dialCode: string;
  phone: string;
  ieeeId: string;
  sb: SB | '';
  country: Country | '';
  facebookLink: string;
}

const initial: FormState = {
  careerStage: null,
  gender: null,
  dialCode: DIAL_CODES[0].dial, // Tunisia (+216)
  phone: '',
  ieeeId: '',
  sb: '',
  country: '',
  facebookLink: '',
};

/**
 * Page 1 of the registration flow - participant info (POST /registration).
 *
 * "Are you an IEEE member?" only decides which fields to show (member number,
 * student branch) - the answer is never sent. Membership and RAS come from
 * IEEE's records, looked up after registration by member number, else email.
 */
export default function ParticipantInfoForm({ onSuccess }: { onSuccess: () => void }) {
  const registerParticipant = useRegistrationStore((s) => s.registerParticipant);
  const submitting = useRegistrationStore((s) => s.submitting);

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const [saysIeeeMember, setSaysIeeeMember] = useState<boolean | null>(null);
  const isStudent = form.careerStage === 'Student';
  const asksBranch = saysIeeeMember === true && isStudent;

  // Local number digits only (drop spaces/dashes and any national trunk `0`),
  // then prepend the selected dial code to build the E.164 value.
  const localDigits = form.phone.replace(/[\s-]/g, '').replace(/^0+/, '');
  const fullPhone = `${form.dialCode}${localDigits}`;

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.careerStage) e.careerStage = 'Select one';
    if (!form.gender) e.gender = 'Select one';
    if (!localDigits) e.phone = 'Required';
    else if (!/^\d{4,14}$/.test(localDigits)) e.phone = 'Enter a valid phone number (digits only)';
    else if (!/^\+[1-9]\d{1,14}$/.test(fullPhone)) e.phone = 'Invalid phone number for this country code';
    if (asksBranch && !form.sb) e.sb = 'Required for IEEE students';
    if (!form.country) e.country = 'Select your country';
    const ieeeIdError = saysIeeeMember ? ieeeMemberNumberError(form.ieeeId) : null;
    if (ieeeIdError) e.ieeeId = ieeeIdError;
    if (!form.facebookLink.trim()) e.facebookLink = 'Required';
    else if (!isFacebookUrl(form.facebookLink)) {
      e.facebookLink = 'Enter a valid facebook.com profile link';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    try {
      await registerParticipant({
        careerStage: form.careerStage as CareerStage,
        gender: form.gender as Gender,
        phone: fullPhone,
        // Hidden fields are never sent: the answer itself isn't stored.
        ieeeId: saysIeeeMember ? Number(form.ieeeId.trim()) : undefined,
        sb: asksBranch && form.sb ? (form.sb as SB) : undefined,
        country: form.country as Country,
        facebookLink: form.facebookLink.trim(),
      });
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Registration failed. Please try again.',
      );
    }
  };

  const complete =
    saysIeeeMember !== null &&
    !!form.careerStage &&
    !!form.gender &&
    !!form.phone &&
    !!form.country &&
    (!saysIeeeMember || !!form.ieeeId.trim()) &&
    (!asksBranch || !!form.sb);

  return (
    <motion.form
      className="reg-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="reg-section-label">Participant Information</div>

      {/* IEEE membership - only shows the member number and branch fields.
          The answer isn't stored: membership comes from IEEE's records. */}
      <div className="reg-field">
        <label className="reg-label">Are you an IEEE member? *</label>
        <div className="reg-toggle-group">
          <button
            type="button"
            className={`reg-toggle ${saysIeeeMember === true ? 'reg-toggle-active-green' : ''}`}
            onClick={() => setSaysIeeeMember(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`reg-toggle ${saysIeeeMember === false ? 'reg-toggle-active-green' : ''}`}
            onClick={() => {
              setSaysIeeeMember(false);
              set('ieeeId', '');
              set('sb', '');
            }}
          >
            No
          </button>
        </div>
      </div>

      {/* Student vs Young Professional */}
      <div className="reg-field">
        <label className="reg-label">Are you a student or a young professional? *</label>
        <div className="reg-toggle-group">
          <button
            type="button"
            className={`reg-toggle ${form.careerStage === 'Student' ? 'reg-toggle-active-green' : ''}`}
            onClick={() => set('careerStage', 'Student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`reg-toggle ${form.careerStage === 'YoungProfessional' ? 'reg-toggle-active-green' : ''}`}
            onClick={() => {
              set('careerStage', 'YoungProfessional');
              set('sb', '');
            }}
          >
            Young Professional
          </button>
        </div>
        {errors.careerStage && <span className="reg-error">{errors.careerStage}</span>}
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

      {/* Facebook profile - required */}
      <div className="reg-field">
        <label className="reg-label" htmlFor="facebookLink">Facebook Profile *</label>
        <input
          id="facebookLink"
          type="url"
          className={`reg-input ${errors.facebookLink ? 'reg-input-error' : ''}`}
          placeholder="https://www.facebook.com/your.profile"
          autoComplete="url"
          value={form.facebookLink}
          onChange={(e) => set('facebookLink', e.target.value)}
        />
        {errors.facebookLink && <span className="reg-error">{errors.facebookLink}</span>}
      </div>
      
      {/* IEEE member number - required from IEEE members */}
      <AnimatePresence>
        {saysIeeeMember === true && (
          <motion.div
            className="reg-field"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="reg-label" htmlFor="ieeeId">IEEE Member Number *</label>
            <input
              id="ieeeId"
              className={`reg-input ${errors.ieeeId ? 'reg-input-error' : ''}`}
              type="text"
              inputMode="numeric"
              placeholder="e.g. 12345678"
              value={form.ieeeId}
              onChange={(e) => set('ieeeId', e.target.value)}
            />
            {errors.ieeeId && <span className="reg-error">{errors.ieeeId}</span>}
            <span className="reg-field-hint">
              We check your IEEE and RAS membership with IEEE using this number.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student branch - IEEE students only */}
      <AnimatePresence>
        {asksBranch && (
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
