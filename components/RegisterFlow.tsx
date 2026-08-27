'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useAuthStore, useRegistrationStore } from '@/lib/store';
import { REGISTRATION_OPEN, PARTICIPANT_REGISTRATION_OPEN } from '@/lib/config';
import AuthModal from './AuthModal';
import ParticipantInfoForm from './register/ParticipantInfoForm';
import TeamStep from './register/TeamStep';
import LoadingScreen from './LoadingScreen';

type Step = 'participant' | 'choosePath' | 'team' | 'done';

const SUBTITLES: Record<Step, string> = {
  participant: 'Tell us about yourself to complete your registration.',
  choosePath: 'Almost done. One more choice.',
  team: 'Create or join a team for the competition or the technical challenge.',
  done: 'You are all set!',
};

/**
 * Unified registration flow (spec: auth → Page 1 participant → Page 2 team).
 *
 * `initialChallenge` skips the "join the challenge?" prompt and goes straight to
 * the team step - used by the /register/challenger entry point.
 */
export default function RegisterFlow({ initialChallenge = false }: { initialChallenge?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const account = useAuthStore((s) => s.account);
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = !!accessToken;
  const isRegistered = useRegistrationStore((s) => s.isRegistered);
  const hydrating = useRegistrationStore((s) => s.hydrating);

  const [showAuthGate, setShowAuthGate] = useState(true);
  const [step, setStep] = useState<Step>(() =>
    isRegistered ? (initialChallenge ? 'team' : 'choosePath') : 'participant',
  );
  const currentStep = isRegistered ? step : 'participant';
  const firstName = account?.name.trim();

  // Set once the user completes Step 1 in this session, so the "arrived already
  // registered → dashboard" redirect below doesn't fire for a brand-new
  // registration the moment it flips `isRegistered` true.
  const progressedStep1 = useRef(false);

  // A user who reaches the registration flow already registered (e.g. an
  // existing account signing in via Google, which redirects back here) has no
  // reason to see Step 1/2 - send them to their dashboard. We wait for the
  // backend profile reconciliation to settle (`initialized && !hydrating`) so
  // we act on the real status, not a stale persisted flag, and we skip it once
  // the user has progressed past Step 1 here (a genuine new registration).
  useEffect(() => {
    if (!initialized || hydrating || progressedStep1.current) return;
    if (isAuthenticated && isRegistered) window.location.href = '/dashboard';
  }, [initialized, hydrating, isAuthenticated, isRegistered]);

  // Once Step 1 is done in the non-challenge flow we land on the `done` screen,
  // play its success animation as a short transition, then send the user to
  // their dashboard automatically.
  useEffect(() => {
    if (currentStep !== 'done') return;
    const t = setTimeout(() => { window.location.href = '/dashboard'; }, 1600);
    return () => clearTimeout(t);
  }, [currentStep]);

  // Participant sign-up can be closed on its own while the challenger entry
  // point stays open, so this is decided per entry point rather than globally.
  // A challenger still fills in the participant form as Step 1 - that belongs
  // to entering the challenge, so it is not blocked here.
  const participantEntryClosed = !initialChallenge && !PARTICIPANT_REGISTRATION_OPEN;

  // Registration closed - block the entry point, including direct URL
  // navigation (regardless of auth state).
  if (!REGISTRATION_OPEN || participantEntryClosed) {
    return (
      <div className="reg-page">
        <div className="reg-container">
          <Link href="/" className="reg-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <div className="reg-info-banner">
            <div className="reg-info-badge">REGISTRATION</div>
            <h2 className="reg-info-title">Registration opens soon</h2>
            <p className="reg-info-subtitle">
              {participantEntryClosed && REGISTRATION_OPEN
                ? 'Participant registration is currently closed. Please check back soon.'
                : 'Registration is temporarily closed. Please check back soon.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Wait for auth state before deciding anything (avoids a flash).
  if (!initialized) return <LoadingScreen />;

  // Not authenticated → gate behind the auth modal (spec prerequisite).
  if (!isAuthenticated && showAuthGate) {
    return (
      <div className="reg-page">
        {/* The user got here by clicking "Register", so open on the signup
            form. On success we simply drop the gate: they are already on the
            page they wanted, so there is no redirect to get wrong. */}
        <AuthModal
          initialMode="signup"
          onClose={() => { setShowAuthGate(false); window.location.href = '/'; }}
          onSuccess={() => setShowAuthGate(false)}
          pendingRoute={initialChallenge ? '/register/challenger' : '/register'}
        />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const onParticipantDone = () => {
    progressedStep1.current = true;
    // After Step 1 go straight to the dashboard - no intermediate screens.
    window.location.href = '/dashboard';
  };

  return (
    <div className="reg-page">
      <div className="reg-container">
        <Link href="/" className="reg-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <motion.div
          className="reg-info-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="reg-info-badge">REGISTRATION</div>
          <h2 className="reg-info-title">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
          </h2>
          <p className="reg-info-subtitle">{SUBTITLES[currentStep]}</p>
        </motion.div>

        {currentStep === 'participant' && <ParticipantInfoForm onSuccess={onParticipantDone} />}

        {currentStep === 'choosePath' && (
          <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="reg-section-label">Compete as a team</div>
            <p className="reg-account-hint">
              Would you like to compete at TRSYP 3.0 as part of a team? You pick the
              track - the competition or the technical challenge - on the next step.
            </p>
            <div className="reg-toggle-group">
              <button type="button" className="reg-toggle reg-toggle-active-green" onClick={() => setStep('team')}>
                Yes, I want a team
              </button>
              <button type="button" className="reg-toggle" onClick={() => setStep('done')}>
                No, just attending
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 'team' && <TeamStep />}

        {currentStep === 'done' && (
          <motion.div
            className="reg-form reg-success-popup"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="reg-success-anim">
              <svg className="reg-success-check" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="28" stroke="var(--color-green)" strokeWidth="2.5" />
                <path className="reg-check-path" d="M18 30l8 8 16-16" stroke="var(--color-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="reg-success-popup-title">You&apos;re registered!</h2>
            {/* TEMP: payment mention removed while PAYMENT_ENABLED = false in Dashboard.tsx.
              Original text: "Your spot for TRSYP 3.0 is reserved. Track your status and submit your payment from your dashboard." */}
            <p className="reg-success-popup-text">
              Your spot for TRSYP 3.0 is reserved. Taking you to your dashboard…
            </p>
            <Link href="/dashboard" className="reg-success-popup-btn">Go to My Dashboard</Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
