import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth-store';
import { registrationService } from '../api/registration.service';
import { ApiError } from '../api/http';
import { features } from '../config';
import type {
  BackendParticipant,
  Country,
  Gender,
  ParticipantType,
  RegisterParticipantPayload,
  SB,
  UpdateParticipantPayload,
} from '../api/types';

export type UserType = 'participant' | 'challenger';
export type RegStatus =
  | 'waiting_for_payment'
  | 'waiting_for_verification'
  | 'approved';

/** Kept for the dashboard's optional team display. */
export interface TeamMember {
  name: string;
  email: string;
  whatsapp: string;
  university: string;
  isIeee: boolean;
  ieeeId: string;
  isRas: boolean;
}

/**
 * Dashboard-facing profile. Identity (name/email) comes from Supabase auth;
 * the participant fields come from Page 1 of the registration flow.
 */
export interface UserData {
  userType: UserType;
  fullName: string;
  email: string;
  whatsapp: string;
  university: string;
  isIeee: boolean;
  ieeeId: string;
  isRas: boolean;
  /**
   * Raw participant fields, kept so the profile editor can prefill itself
   * without a second round trip. Optional because profiles persisted by older
   * builds predate them.
   */
  gender?: Gender;
  participantType?: ParticipantType;
  sb?: SB | '';
  country?: Country;
  status: RegStatus;
  paymentProofSubmitted: boolean;
  paymentFileName: string;
  participantId?: string;
  teamName?: string;
  memberCount?: number;
  members?: TeamMember[];
}

/** Page 1 (participant info) input - matches the registration flow spec. */
export interface ParticipantRegistrationInput {
  participantType: ParticipantType;
  gender: Gender;
  phone: string;
  ieeeId?: number;
  sb?: SB;
  country: Country;
  /** IEEE RAS society membership - answered at registration, defaults to false. */
  isRas: boolean;
}

interface RegistrationState {
  user: UserData | null;
  isRegistered: boolean;
  submitting: boolean;
  /** True while the first backend profile sync is in flight - lets the UI avoid
   *  flashing a "not registered" state before we actually know. */
  hydrating: boolean;
  error: string | null;

  registerParticipant: (input: ParticipantRegistrationInput) => Promise<void>;
  /** Edit an existing participant - only the changed fields need to be passed. */
  updateProfile: (patch: Partial<ParticipantRegistrationInput>) => Promise<void>;
  submitPayment: (fileName: string) => Promise<void>;
  updateStatus: (status: RegStatus) => void;
  hydrateFromBackend: () => Promise<void>;
  reset: () => void;
}

function toPayload(input: ParticipantRegistrationInput): RegisterParticipantPayload {
  const isIeee = input.participantType !== 'NonIEEE';
  return {
    phone: input.phone,
    gender: input.gender,
    participantType: input.participantType,
    ieeeId: isIeee ? input.ieeeId : undefined,
    sb: input.participantType === 'Student' ? input.sb : undefined,
    country: input.country,
    // RAS is an IEEE society - never claim it for a non-IEEE participant.
    isRas: isIeee && input.isRas,
  };
}

/**
 * The participant half of `UserData`, read off a saved backend row. Identity
 * (name/email) is not in here - that half comes from the auth store.
 */
function participantFields(p: BackendParticipant) {
  return {
    whatsapp: p.phone,
    university: p.sb ?? '',
    isIeee: p.participantType !== 'NonIEEE',
    ieeeId: p.ieeeId ? String(p.ieeeId) : '',
    isRas: p.isRas ?? false,
    gender: p.gender as Gender,
    participantType: p.participantType,
    sb: (p.sb ?? '') as SB | '',
    country: p.country,
    participantId: p.id,
  };
}

/**
 * Same shape, derived from what the user typed. Used only when the registration
 * API is off (`features.registrationApi`), where there is no saved row to read.
 */
function participantFieldsFromInput(input: ParticipantRegistrationInput) {
  const isIeee = input.participantType !== 'NonIEEE';
  return {
    whatsapp: input.phone,
    university: input.sb ?? '',
    isIeee,
    ieeeId: input.ieeeId ? String(input.ieeeId) : '',
    isRas: isIeee && input.isRas,
    gender: input.gender,
    participantType: input.participantType,
    sb: (input.sb ?? '') as SB | '',
    country: input.country,
  };
}

/**
 * Registration store - source of truth for the signed-in participant's profile.
 * Persisted so the dashboard survives reloads while the backend registration
 * module is still a placeholder.
 */
export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      user: null,
      isRegistered: false,
      submitting: false,
      hydrating: false,
      error: null,

      registerParticipant: async (input) => {
        if (get().submitting) return;
        set({ submitting: true, error: null });
        try {
          const auth = useAuthStore.getState();
          const token = await auth.getAccessToken();

          let saved: BackendParticipant | null = null;
          if (token) {
            try {
              saved = await registrationService.register(toPayload(input), token);
            } catch (e) {
              if (!(e instanceof ApiError && e.status === 409)) throw e;
              saved = await registrationService.getProfile(token);
            }
          }
          const participantId = saved?.id;

          // When the backend API is live, "registered" must be backed by a real
          // participant row. Otherwise local state drifts from the server and
          // the user appears unregistered after signing back in (the backend is
          // the source of truth on the next hydrate).
          if (features.registrationApi) {
            if (!token) throw new Error('You must be signed in to register.');
            if (!participantId) throw new Error('Registration could not be saved. Please try again.');
          }

          const account = auth.account;
          const email = account?.email ?? auth.email ?? '';
          const fullName = account
            ? `${account.name} ${account.lastName}`.trim()
            : email
              ? email.split('@')[0]
              : 'Participant';

          set({
            user: {
              userType: 'participant',
              fullName,
              email,
              // Prefer the stored row: the server normalises what it keeps
              // (e.g. RAS is never true for a non-IEEE participant).
              ...(saved ? participantFields(saved) : participantFieldsFromInput(input)),
              status: 'waiting_for_payment',
              paymentProofSubmitted: false,
              paymentFileName: '',
              participantId,
            },
            isRegistered: true,
            submitting: false,
          });
        } catch (e) {
          set({
            submitting: false,
            error: e instanceof Error ? e.message : 'Registration failed',
          });
          throw e;
        }
      },

      updateProfile: async (patch) => {
        const { user, submitting } = get();
        if (!user || submitting) return;
        set({ submitting: true, error: null });
        try {
          const token = await useAuthStore.getState().getAccessToken();
          if (features.registrationApi && !token) {
            throw new Error('You must be signed in to edit your profile.');
          }

          // Send only what changed. The server derives `sb`/`ieeeId`/`isRas`
          // from the resulting membership type, so a switch to NonIEEE clears
          // them without the client having to ask.
          const body: UpdateParticipantPayload = {};
          if (patch.phone !== undefined) body.phone = patch.phone;
          if (patch.gender !== undefined) body.gender = patch.gender;
          if (patch.country !== undefined) body.country = patch.country;
          if (patch.participantType !== undefined) {
            body.participantType = patch.participantType;
          }
          if (patch.ieeeId !== undefined) body.ieeeId = patch.ieeeId;
          if (patch.sb !== undefined) body.sb = patch.sb;
          if (patch.isRas !== undefined) body.isRas = patch.isRas;

          const saved = token
            ? await registrationService.updateProfile(body, token)
            : null;

          set({
            user: saved
              ? { ...user, ...participantFields(saved) }
              : // API off: fold the patch in locally so the UI still reflects it.
                {
                  ...user,
                  ...participantFieldsFromInput({
                    participantType: patch.participantType ?? user.participantType ?? 'NonIEEE',
                    gender: patch.gender ?? user.gender ?? 'male',
                    phone: patch.phone ?? user.whatsapp,
                    ieeeId: patch.ieeeId ?? (user.ieeeId ? Number(user.ieeeId) : undefined),
                    sb: patch.sb ?? (user.sb || undefined),
                    country: patch.country ?? user.country ?? 'Tunisia',
                    isRas: patch.isRas ?? user.isRas,
                  }),
                  participantId: user.participantId,
                },
            submitting: false,
          });
        } catch (e) {
          set({
            submitting: false,
            error: e instanceof Error ? e.message : 'Could not save your profile',
          });
          throw e;
        }
      },

      submitPayment: async (fileName) => {
        const { user, submitting } = get();
        if (!user || submitting) return;
        set({ submitting: true });
        try {
          const token = await useAuthStore.getState().getAccessToken();
          await registrationService.submitPayment(fileName, token ?? '');
          set({
            user: {
              ...user,
              status: 'waiting_for_verification',
              paymentProofSubmitted: true,
              paymentFileName: fileName,
            },
            submitting: false,
          });
        } catch (e) {
          set({ submitting: false, error: e instanceof Error ? e.message : 'Payment failed' });
          throw e;
        }
      },

      updateStatus: (status) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, status } });
      },

      hydrateFromBackend: async () => {
        set({ hydrating: true });
        try {
          const auth = useAuthStore.getState();
          const token = await auth.getAccessToken();
          if (!token) return;

          const participant = await registrationService.getProfile(token);
          if (!participant) {
            // When the registration API is live, the backend is the source of
            // truth: no profile means the user is NOT registered. Clear any
            // stale persisted flag so RegisterFlow doesn't skip Step 1 and drop
            // the user at "create team" with no backend participant.
            if (features.registrationApi) set({ user: null, isRegistered: false });
            return;
          }

          const account = auth.account;
          const email = account?.email ?? auth.email ?? '';
          const fullName = account
            ? `${account.name} ${account.lastName}`.trim()
            : email
              ? email.split('@')[0]
              : 'Participant';

          set({
            user: {
              userType: 'participant',
              fullName,
              email,
              ...participantFields(participant),
              status: participant.paid ? 'approved' : 'waiting_for_payment',
              paymentProofSubmitted: false,
              paymentFileName: '',
            },
            isRegistered: true,
          });
        } catch {
          // Non-fatal: profile may not exist yet (404), or backend is down.
        } finally {
          set({ hydrating: false });
        }
      },

      reset: () => set({ user: null, isRegistered: false, error: null }),
    }),
    {
      name: 'trsyp_user',
      partialize: (state) => ({ user: state.user, isRegistered: state.isRegistered }),
    },
  ),
);
