'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useAuthStore, useRegistrationStore } from '@/lib/store';
import { smashRoomService } from '@/lib/api/smash-room.service';
import {
  SB_OPTIONS,
  type SB,
  type SmashPassType,
  type SmashRoomEntry,
  type SmashRoomOverview,
} from '@/lib/api/types';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

async function currentToken(): Promise<string> {
  return (await useAuthStore.getState().getAccessToken()) ?? '';
}

const PASS_TYPES: { value: SmashPassType; label: string }[] = [
  { value: 'DUO', label: 'Duo' },
  { value: 'TRIO', label: 'Trio' },
  { value: 'SQUAD', label: 'Squad' },
];

const passLabel = (p: SmashPassType) => PASS_TYPES.find((t) => t.value === p)?.label ?? p;

interface FormState {
  firstName: string;
  lastName: string;
  /** IEEE members pick their student branch, everyone else types a university. */
  ieee: boolean;
  sb: SB | '';
  university: string;
  riddleAnswer: string;
  passType: SmashPassType | '';
}

type Errors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.firstName.trim()) e.firstName = 'Enter your name';
  if (!f.lastName.trim()) e.lastName = 'Enter your surname';
  if (f.ieee && !f.sb) e.sb = 'Choose your student branch';
  if (!f.ieee && !f.university.trim()) e.university = 'Enter your university';
  if (!f.riddleAnswer.trim()) e.riddleAnswer = 'Enter your riddle solution';
  if (!f.passType) e.passType = 'Choose duo, trio or squad';
  return e;
}

/**
 * The form itself, mounted once the profile is known so it can start from
 * what the profile already says - everything stays editable.
 */
function SmashRoomForm({
  defaults,
  onSubmitted,
}: {
  defaults: SmashRoomOverview['prefill'];
  onSubmitted: (entry: SmashRoomEntry) => void;
}) {
  const [form, setForm] = useState<FormState>({
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    ieee: defaults.isIeee,
    sb: defaults.sb ?? '',
    university: defaults.university ?? '',
    riddleAnswer: '',
    passType: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setConfirming(false);
  };

  const review = (e: FormEvent) => {
    e.preventDefault();
    setSubmitErr('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  const submit = async () => {
    setSubmitErr('');
    setSubmitting(true);
    try {
      onSubmitted(
        await smashRoomService.submit(
          {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            sb: form.ieee ? (form.sb as SB) : null,
            university: form.ieee ? null : form.university.trim(),
            riddleAnswer: form.riddleAnswer.trim(),
            passType: form.passType as SmashPassType,
          },
          await currentToken(),
        ),
      );
    } catch (error: unknown) {
      setSubmitErr(errorMessage(error, 'Your form was not sent. Try again.'));
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
        <motion.form
          className="dash-card sr-form"
          onSubmit={review}
          noValidate
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="reg-row">
            <div className="reg-field">
              <label className="reg-label" htmlFor="sr-first">Name *</label>
              <input
                id="sr-first"
                className={`reg-input ${errors.firstName ? 'reg-input-error' : ''}`}
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                maxLength={60}
                autoComplete="given-name"
              />
              {errors.firstName && <span className="reg-error">{errors.firstName}</span>}
            </div>
            <div className="reg-field">
              <label className="reg-label" htmlFor="sr-last">Surname *</label>
              <input
                id="sr-last"
                className={`reg-input ${errors.lastName ? 'reg-input-error' : ''}`}
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                maxLength={60}
                autoComplete="family-name"
              />
              {errors.lastName && <span className="reg-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="reg-field">
            <span className="reg-label" id="sr-ieee-label">Are you an IEEE member?</span>
            <div className="reg-toggle-group" role="group" aria-labelledby="sr-ieee-label">
              <button
                type="button"
                className={`reg-toggle ${form.ieee ? 'reg-toggle-active-green' : ''}`}
                aria-pressed={form.ieee}
                onClick={() => set('ieee', true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`reg-toggle ${!form.ieee ? 'reg-toggle-active-green' : ''}`}
                aria-pressed={!form.ieee}
                onClick={() => set('ieee', false)}
              >
                No
              </button>
            </div>
          </div>

          {form.ieee ? (
            <div className="reg-field">
              <label className="reg-label" htmlFor="sr-sb">Student branch *</label>
              <select
                id="sr-sb"
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
            </div>
          ) : (
            <div className="reg-field">
              <label className="reg-label" htmlFor="sr-university">University *</label>
              <input
                id="sr-university"
                className={`reg-input ${errors.university ? 'reg-input-error' : ''}`}
                value={form.university}
                onChange={(e) => set('university', e.target.value)}
                maxLength={120}
              />
              {errors.university && <span className="reg-error">{errors.university}</span>}
            </div>
          )}

          <div className="reg-field">
            <label className="reg-label" htmlFor="sr-riddle">Riddle solution *</label>
            <textarea
              id="sr-riddle"
              className={`reg-input sr-textarea ${errors.riddleAnswer ? 'reg-input-error' : ''}`}
              value={form.riddleAnswer}
              onChange={(e) => set('riddleAnswer', e.target.value)}
              maxLength={500}
              rows={3}
            />
            {errors.riddleAnswer && <span className="reg-error">{errors.riddleAnswer}</span>}
          </div>

          <div className="reg-field">
            <span className="reg-label" id="sr-pass-label">Pass type *</span>
            <div className="reg-toggle-group" role="radiogroup" aria-labelledby="sr-pass-label">
              {PASS_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={form.passType === t.value}
                  className={`reg-toggle ${form.passType === t.value ? 'reg-toggle-active-green' : ''}`}
                  onClick={() => set('passType', t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {errors.passType && <span className="reg-error">{errors.passType}</span>}
          </div>

          {submitErr && <span className="reg-error" style={{ display: 'block' }}>{submitErr}</span>}

          {confirming ? (
            <div className="sr-confirm" onKeyDown={(e) => e.key === 'Escape' && !submitting && setConfirming(false)}>
              <p className="sr-confirm-note">
                This is final. Once sent, you can&apos;t change your answer or your pass.
              </p>
              <div className="sr-confirm-actions">
                <button type="button" className="dash-save-btn" onClick={submit} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Confirm and send'}
                </button>
                {/* Focus lands on the safe choice. */}
                <button
                  type="button"
                  className="ws-back"
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                  autoFocus
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="sr-confirm-actions">
              <button type="submit" className="dash-save-btn">
                Send form
              </button>
            </div>
          )}
        </motion.form>
  );
}

/**
 * The Smash Room form: name, surname, student branch (or university), riddle
 * solution and pass type. One submission per participant, final - so sending
 * asks for a confirmation first. The answer is judged by the organisers.
 */
export default function SmashRoomSection() {
  const user = useRegistrationStore((s) => s.user);
  const hydrating = useRegistrationStore((s) => s.hydrating);

  const [overview, setOverview] = useState<SmashRoomOverview | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const hasProfile = !!user;
  useEffect(() => {
    if (!hasProfile) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await smashRoomService.getOverview(await currentToken());
        if (cancelled) return;
        setOverview(data);
        setLoadErr('');
      } catch (error: unknown) {
        if (!cancelled) setLoadErr(errorMessage(error, 'Failed to load the Smash Room form'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasProfile, reloadKey]);

  const notRegistered = !user && !hydrating;
  const entry = overview?.entry;

  return (
    <section className="dash-page dash-section">
      <div className="dash-container">
        <header className="dash-section-head">
          <span className="dash-section-kicker">Smash Room</span>
          <h1 className="dash-section-title">Your Smash Room form</h1>
          <p className="dash-section-blurb">
            Send your riddle solution and choose your pass. You can send the form once, so check it before
            you do.
          </p>
        </header>

        {notRegistered ? (
          <div className="dash-card dash-noteam-card">
            <div className="dash-card-title">Not registered yet</div>
            <p className="dash-noteam-msg">You need a participant profile before you can send the form.</p>
            <div className="dash-noteam-actions">
              <Link href="/register" className="dash-noteam-btn dash-noteam-btn-primary">
                Go to registration
              </Link>
            </div>
          </div>
        ) : loadErr ? (
          <div className="dash-card dash-noteam-card">
            <div className="dash-card-title">Couldn&apos;t load the form</div>
            <span className="reg-error" style={{ display: 'block' }}>{loadErr}</span>
            <div className="dash-noteam-actions">
              <button type="button" className="dash-noteam-btn" onClick={() => setReloadKey((k) => k + 1)}>
                Try again
              </button>
            </div>
          </div>
        ) : !overview ? (
          <div className="dash-card">
            <p className="dash-noteam-msg">Loading the form…</p>
          </div>
        ) : entry ? (
          <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="dash-card-title">Submitted</div>
            <div className="dash-detail-row">
              <span className="dash-detail-label">Name</span>
              <span className="dash-detail-value">{`${entry.firstName} ${entry.lastName}`}</span>
            </div>
            <div className="dash-detail-row">
              <span className="dash-detail-label">{entry.sb ? 'Student branch' : 'University'}</span>
              <span className="dash-detail-value">{entry.sb ?? entry.university}</span>
            </div>
            <div className="dash-detail-row">
              <span className="dash-detail-label">Pass</span>
              <span className="dash-detail-value">{passLabel(entry.passType)}</span>
            </div>
            <div className="dash-detail-row">
              <span className="dash-detail-label">Riddle solution</span>
              <span className="dash-detail-value sr-answer">{entry.riddleAnswer}</span>
            </div>
          </motion.div>
        ) : overview.phase !== 'open' ? (
          <div className="ws-notice">
            {overview.phase === 'soon'
              ? 'The Smash Room form opens soon. You can send it here once it opens.'
              : 'The Smash Room form is closed.'}
          </div>
        ) : !overview.canSubmit ? (
          <div className="ws-notice">
            The Smash Room is for participants whose payment is confirmed.{' '}
            <Link href="/dashboard/payment">Check your payment</Link>
          </div>
        ) : (
          <SmashRoomForm
            defaults={overview.prefill}
            onSubmitted={(submitted) => setOverview((o) => (o ? { ...o, entry: submitted } : o))}
          />
        )}
      </div>
    </section>
  );
}
