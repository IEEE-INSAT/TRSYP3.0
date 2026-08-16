'use client';

import { useEffect, useMemo, useRef, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore, useRegistrationStore } from '@/lib/store';
import {
  COUNTRY_OPTIONS,
  DIAL_CODES,
  SB_OPTIONS,
  type Country,
  type Gender,
  type ParticipantType,
  type SB,
} from '@/lib/api/types';

interface FormState {
  name: string;
  lastName: string;
  participantType: ParticipantType;
  gender: Gender;
  dialCode: string;
  phone: string;
  ieeeId: string;
  isRas: boolean;
  sb: SB | '';
  country: Country | '';
}

/**
 * Split a stored E.164 number back into a dial code and a local part, so the
 * editor opens on the same two controls the registration form used. Longest
 * prefix wins - `+1` must not shadow `+216`.
 */
function splitPhone(e164: string): { dialCode: string; phone: string } {
  const match = [...DIAL_CODES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => e164.startsWith(c.dial));
  if (!match) return { dialCode: DIAL_CODES[0].dial, phone: e164.replace(/^\+/, '') };
  return { dialCode: match.dial, phone: e164.slice(match.dial.length) };
}

/**
 * Self-service profile editor.
 *
 * Everything a participant told us is editable here except the email, which is
 * the Supabase login identity and can only change through Supabase's own
 * confirmation flow. Changing membership type rewrites its dependent fields
 * (branch, IEEE ID, RAS) on the server, so the form asks for whatever the new
 * type needs before it will submit.
 */
export default function ProfileForm() {
  const account = useAuthStore((s) => s.account);
  const updateName = useAuthStore((s) => s.updateName);
  const user = useRegistrationStore((s) => s.user);
  const updateProfile = useRegistrationStore((s) => s.updateProfile);
  const submitting = useRegistrationStore((s) => s.submitting);

  const initial = useMemo<FormState>(() => {
    const { dialCode, phone } = splitPhone(user?.whatsapp ?? '');
    return {
      name: account?.name ?? '',
      lastName: account?.lastName ?? '',
      participantType: user?.participantType ?? 'NonIEEE',
      gender: user?.gender ?? 'male',
      dialCode,
      phone,
      ieeeId: user?.ieeeId ?? '',
      isRas: user?.isRas ?? false,
      sb: user?.sb ?? '',
      country: user?.country ?? '',
    };
  }, [account, user]);

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // The two halves of the profile land at different times: the participant row
  // is restored from local storage immediately, while the account (and the
  // name on it) only arrives once /auth/me answers. Re-seed the fields as they
  // do - but never on top of edits the user has already started making.
  const dirty = useRef(false);
  useEffect(() => {
    if (dirty.current) return;
    setForm(initial);
  }, [initial]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    dirty.current = true;
    setForm((p) => ({ ...p, [key]: val }));
    setSaved(false);
  };

  const isIeee = form.participantType !== 'NonIEEE';
  const isStudent = form.participantType === 'Student';

  const localDigits = form.phone.replace(/[\s-]/g, '').replace(/^0+/, '');
  const fullPhone = `${form.dialCode}${localDigits}`;

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!localDigits) e.phone = 'Required';
    else if (!/^\d{4,14}$/.test(localDigits)) e.phone = 'Enter a valid phone number (digits only)';
    else if (!/^\+[1-9]\d{1,14}$/.test(fullPhone)) e.phone = 'Invalid phone number for this country code';
    if (!form.country) e.country = 'Select your country';
    if (isStudent && !form.sb) e.sb = 'Required for students';
    if (isIeee && !form.ieeeId.trim()) e.ieeeId = 'Required for IEEE members';
    else if (form.ieeeId && !/^\d+$/.test(form.ieeeId.trim())) e.ieeeId = 'Digits only';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /**
   * Only the fields the user actually touched. Sending an unchanged
   * `participantType` would make the server re-validate the whole membership
   * (branch + IEEE ID) on what is really just a phone-number edit.
   */
  const buildPatch = () => {
    const patch: Parameters<typeof updateProfile>[0] = {};
    if (form.participantType !== initial.participantType) {
      patch.participantType = form.participantType;
    }
    if (form.gender !== initial.gender) patch.gender = form.gender;
    if (fullPhone !== user?.whatsapp) patch.phone = fullPhone;
    if (form.country !== initial.country) patch.country = form.country as Country;
    if (isIeee && form.ieeeId !== initial.ieeeId) {
      patch.ieeeId = form.ieeeId ? Number(form.ieeeId) : undefined;
    }
    if (isStudent && form.sb !== initial.sb) patch.sb = (form.sb || undefined) as SB | undefined;
    if (isIeee && form.isRas !== initial.isRas) patch.isRas = form.isRas;
    return patch;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitError(null);
    setSaved(false);
    try {
      // The name lives on the account, the rest on the participant row - two
      // endpoints, one button. The name goes first: it is the cheaper call and
      // the one least likely to be rejected.
      const renamed =
        form.name.trim() !== (account?.name ?? '') ||
        form.lastName.trim() !== (account?.lastName ?? '');
      if (renamed) {
        await updateName(form.name.trim(), form.lastName.trim());
      }

      const patch = buildPatch();
      if (Object.keys(patch).length > 0) await updateProfile(patch);
      // Saved state matches the store again, so let it re-seed the fields with
      // whatever the server normalised (e.g. a cleared branch after a switch).
      dirty.current = false;
      setSaved(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not save your changes. Please try again.',
      );
    }
  };

  if (!user) return null;

  return (
    <motion.form
      className="reg-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="reg-section-label">Account</div>

      <div className="reg-row">
        <div className="reg-field">
          <label className="reg-label" htmlFor="name">First Name *</label>
          <input
            id="name"
            className={`reg-input ${errors.name ? 'reg-input-error' : ''}`}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && <span className="reg-error">{errors.name}</span>}
        </div>

        <div className="reg-field">
          <label className="reg-label" htmlFor="lastName">Last Name *</label>
          <input
            id="lastName"
            className={`reg-input ${errors.lastName ? 'reg-input-error' : ''}`}
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
          />
          {errors.lastName && <span className="reg-error">{errors.lastName}</span>}
        </div>
      </div>

      {/* Email is the Supabase login identity - changing it would need a
          re-verification round trip, so it is shown but not editable. */}
      <div className="reg-field">
        <label className="reg-label" htmlFor="email">Email</label>
        <input
          id="email"
          className="reg-input reg-input-locked"
          value={account?.email ?? user.email}
          readOnly
          disabled
        />
        <span className="reg-field-hint">
          Your email is your sign-in address and can&apos;t be changed here. Contact us if you
          need it updated.
        </span>
      </div>

      <div className="reg-section-label">Participant Information</div>

      {/* IEEE membership */}
      <div className="reg-field">
        <label className="reg-label">Are you an IEEE member? *</label>
        <div className="reg-toggle-group">
          <button
            type="button"
            className={`reg-toggle ${isIeee ? 'reg-toggle-active-green' : ''}`}
            onClick={() => {
              if (isIeee) return;
              set('participantType', 'Student');
            }}
          >
            Yes
          </button>
          <button
            type="button"
            className={`reg-toggle ${!isIeee ? 'reg-toggle-active-green' : ''}`}
            onClick={() => {
              setForm((p) => ({
                ...p,
                participantType: 'NonIEEE',
                ieeeId: '',
                sb: '',
                isRas: false,
              }));
              setSaved(false);
            }}
          >
            No
          </button>
        </div>
      </div>

      {/* Gender */}
      <div className="reg-field">
        <label className="reg-label">Gender *</label>
        <div className="reg-toggle-group">
          <button type="button" className={`reg-toggle ${form.gender === 'male' ? 'reg-toggle-active-green' : ''}`} onClick={() => set('gender', 'male')}>Male</button>
          <button type="button" className={`reg-toggle ${form.gender === 'female' ? 'reg-toggle-active-pink' : ''}`} onClick={() => set('gender', 'female')}>Female</button>
        </div>
      </div>

      {/* Phone */}
      <div className="reg-field">
        <label className="reg-label" htmlFor="profile-phone">Phone Number *</label>
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
            id="profile-phone"
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
        <label className="reg-label" htmlFor="profile-country">Country *</label>
        <select
          id="profile-country"
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

      {/* Membership type - IEEE members only */}
      <AnimatePresence>
        {isIeee && (
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
                className={`reg-toggle ${isStudent ? 'reg-toggle-active-green' : ''}`}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* IEEE ID - IEEE members only */}
      <AnimatePresence>
        {isIeee && (
          <motion.div
            className="reg-field"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="reg-label" htmlFor="profile-ieeeId">IEEE Member ID *</label>
            <input
              id="profile-ieeeId"
              className={`reg-input ${errors.ieeeId ? 'reg-input-error' : ''}`}
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

      {/* RAS membership - IEEE members only */}
      <AnimatePresence>
        {isIeee && (
          <motion.div
            className="reg-field"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="reg-label">Are you a RAS member?</label>
            <div className="reg-toggle-group">
              <button
                type="button"
                className={`reg-toggle ${form.isRas ? 'reg-toggle-active-green' : ''}`}
                onClick={() => set('isRas', true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`reg-toggle ${!form.isRas ? 'reg-toggle-active-green' : ''}`}
                onClick={() => set('isRas', false)}
              >
                No
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student branch - students only */}
      <AnimatePresence>
        {isStudent && (
          <motion.div
            className="reg-field"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className="reg-label" htmlFor="profile-sb">Student Branch *</label>
            <select
              id="profile-sb"
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

      <AnimatePresence>
        {saved && (
          <motion.div
            className="dash-profile-saved"
            role="status"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <span className="dash-profile-saved-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="dash-profile-saved-copy">
              <strong>Profile updated</strong>
              Your changes have been saved.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dash-profile-form-actions">
        <button
          type="button"
          className="dash-profile-reset"
          onClick={() => {
            dirty.current = false;
            setForm(initial);
            setErrors({});
            setSubmitError(null);
            setSaved(false);
          }}
          disabled={submitting}
        >
          Reset
        </button>
        <button type="submit" className="dash-profile-save" disabled={submitting}>
          {submitting ? (
            <>
              <span className="dash-profile-spinner" aria-hidden="true" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </motion.form>
  );
}
