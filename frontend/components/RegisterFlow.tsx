'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuthStore, useRegistrationStore } from '@/lib/store';
import AuthModal from './AuthModal';
import ParticipantInfoForm from './register/ParticipantInfoForm';
import TeamStep from './register/TeamStep';

type Step = 'participant' | 'choosePath' | 'team' | 'done';

const SUBTITLES: Record<Step, string> = {
  participant: 'Tell us about yourself to complete your registration.',
  choosePath: 'Almost done — one more choice.',
  team: 'Create or join a team for the robotics challenge.',
  done: 'You are all set!',
};

/**
 * Unified registration flow (spec: auth → Page 1 participant → Page 2 team).
 *
 * `initialChallenge` skips the "join the challenge?" prompt and goes straight to
 * the team step — used by the /register/challenger entry point.
 */
export default function RegisterFlow({ initialChallenge = false }: { initialChallenge?: boolean }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthenticated = !!accessToken;
  const isRegistered = useRegistrationStore((s) => s.isRegistered);

  const [showAuthGate, setShowAuthGate] = useState(true);
  const [step, setStep] = useState<Step>(() =>
    isRegistered ? (initialChallenge ? 'team' : 'choosePath') : 'participant',
  );

  // When hydration from the backend flips isRegistered to true,
  // advance past the participant step automatically.
  useEffect(() => {
    if (isRegistered && step === 'participant') {
      setStep(initialChallenge ? 'team' : 'choosePath');
    }
  }, [isRegistered, step, initialChallenge]);

  // Wait for auth state before deciding anything (avoids a flash).
  if (!initialized) return null;

  // Not authenticated → gate behind the auth modal (spec prerequisite).
  if (!isAuthenticated && showAuthGate) {
    return (
      <div className="reg-page">
        <AuthModal
          onClose={() => { setShowAuthGate(false); window.location.href = '/'; }}
          onSuccess={() => setShowAuthGate(false)}
          onRegister={() => setShowAuthGate(false)}
          pendingRoute={initialChallenge ? '/register/challenger' : '/register'}
        />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const onParticipantDone = () => setStep(initialChallenge ? 'team' : 'choosePath');

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
          <div className="reg-info-badge">REGISTRATION</div>
          <h2 className="reg-info-title">TRSYP 3.0</h2>
          <p className="reg-info-subtitle">{SUBTITLES[step]}</p>
        </motion.div>

        {step === 'participant' && <ParticipantInfoForm onSuccess={onParticipantDone} />}

        {step === 'choosePath' && (
          <motion.div className="reg-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="reg-section-label">Robotics Challenge</div>
            <p className="reg-account-hint">
              Would you like to compete in the TRSYP 3.0 robotics challenge as part of a team?
            </p>
            <div className="reg-toggle-group">
              <button type="button" className="reg-toggle reg-toggle-active-green" onClick={() => setStep('team')}>
                Yes, join the challenge
              </button>
              <button type="button" className="reg-toggle" onClick={() => setStep('done')}>
                No, just attending
              </button>
            </div>
          </motion.div>
        )}

        {step === 'team' && <TeamStep />}

        {step === 'done' && (
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
            <p className="reg-success-popup-text">
              Your spot for TRSYP 3.0 is reserved. Track your status and submit your payment from your dashboard.
            </p>
            <a href="/dashboard" className="reg-success-popup-btn">Go to My Dashboard</a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
