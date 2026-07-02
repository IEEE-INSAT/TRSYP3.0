'use client';

import { useAuthStore } from './auth-store';
import { useRegistrationStore } from './registration-store';

/**
 * Convenience hook composing the auth + registration stores into the shape the
 * UI consumes. Keeps components decoupled from store internals; for finer
 * control, import the individual stores directly.
 */
export function useAuth() {
  const user = useRegistrationStore((s) => s.user);
  const isRegistered = useRegistrationStore((s) => s.isRegistered);
  const submitting = useRegistrationStore((s) => s.submitting);
  const error = useRegistrationStore((s) => s.error);
  const registerParticipant = useRegistrationStore((s) => s.registerParticipant);
  const submitPayment = useRegistrationStore((s) => s.submitPayment);
  const updateStatus = useRegistrationStore((s) => s.updateStatus);
  const resetRegistration = useRegistrationStore((s) => s.reset);
  const signOut = useAuthStore((s) => s.signOut);

  const logout = async () => {
    resetRegistration();
    await signOut();
  };

  return {
    user,
    isRegistered,
    submitting,
    error,
    registerParticipant,
    submitPayment,
    updateStatus,
    logout,
  };
}
