import { apiFetch } from './http';
import { features } from '../config';
import type { BackendParticipant, RegisterParticipantPayload } from './types';

/**
 * Registration service.
 *
 * PLACEHOLDER STATUS: the backend `RegistrationController` exists but its module
 * is NOT imported into `app.module.ts`, so `/registration/*` routes are not
 * served yet. Every method below contains the real call, guarded by the
 * `features.registrationApi` flag. While the flag is off the methods resolve to
 * `null` and the registration store keeps the profile locally so the dashboard
 * flow stays usable. Flip NEXT_PUBLIC_FEATURE_REGISTRATION_API=true to go live.
 */
export const registrationService = {
  /** POST /registration — register the current Supabase user as a participant. */
  async register(
    payload: RegisterParticipantPayload,
    token: string,
  ): Promise<BackendParticipant | null> {
    if (!features.registrationApi) return null;
    return apiFetch<BackendParticipant>('/registration', {
      method: 'POST',
      body: payload,
      token,
    });
  },

  /** GET /registration/profile — the current user's participant profile. */
  async getProfile(token: string): Promise<BackendParticipant | null> {
    if (!features.registrationApi) return null;
    return apiFetch<BackendParticipant>('/registration/profile', { token });
  },

  /**
   * Submit a payment proof.
   *
   * TODO(backend): the Payment module is currently empty stubs — there is no
   * endpoint nor a model for payment proofs. When it lands, replace this with
   * the real (likely multipart) upload call and drop the placeholder.
   */
  async submitPayment(
    fileName: string,
    token: string,
  ): Promise<{ ok: boolean }> {
    if (!features.registrationApi) return { ok: true };
    // Intended shape — swap for the real (likely multipart) upload once the
    // Payment module exists on the backend.
    await apiFetch('/payment/proof', {
      method: 'POST',
      body: { fileName },
      token,
    });
    return { ok: true };
  },
};
