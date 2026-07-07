import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth-store';
import { registrationService } from '../api/registration.service';
import { ApiError } from '../api/http';
import { features } from '../config';
import type {
  Country,
  Gender,
  ParticipantType,
  RegisterParticipantPayload,
  SB,
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
  status: RegStatus;
  paymentProofSubmitted: boolean;
  paymentFileName: string;
  participantId?: string;
  teamName?: string;
  memberCount?: number;
  members?: TeamMember[];
}

/** Page 1 (participant info) input — matches the registration flow spec. */
export interface ParticipantRegistrationInput {
  participantType: ParticipantType;
  gender: Gender;
  phone: string;
  ieeeId?: number;
  sb?: SB;
  country: Country;
}

interface RegistrationState {
  user: UserData | null;
  isRegistered: boolean;
  submitting: boolean;
  error: string | null;

  registerParticipant: (input: ParticipantRegistrationInput) => Promise<void>;
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
  };
}

/**
 * Registration store — source of truth for the signed-in participant's profile.
 * Persisted so the dashboard survives reloads while the backend registration
 * module is still a placeholder.
 */
export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      user: null,
      isRegistered: false,
      submitting: false,
      error: null,

      registerParticipant: async (input) => {
        set({ submitting: true, error: null });
        try {
          const auth = useAuthStore.getState();
          const token = await auth.getAccessToken();

          let participantId: string | undefined;
          if (token) {
            try {
              const participant = await registrationService.register(toPayload(input), token);
              participantId = participant?.id;
            } catch (e) {
              if (!(e instanceof ApiError && e.status === 409)) throw e;
              const existing = await registrationService.getProfile(token);
              participantId = existing?.id;
            }
          }

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
              whatsapp: input.phone,
              university: input.sb ?? '',
              isIeee: input.participantType !== 'NonIEEE',
              ieeeId: input.ieeeId ? String(input.ieeeId) : '',
              isRas: false,
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

      submitPayment: async (fileName) => {
        const { user } = get();
        if (!user) return;
        const token = await useAuthStore.getState().getAccessToken();
        await registrationService.submitPayment(fileName, token ?? '');
        set({
          user: {
            ...user,
            status: 'waiting_for_verification',
            paymentProofSubmitted: true,
            paymentFileName: fileName,
          },
        });
      },

      updateStatus: (status) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, status } });
      },

      hydrateFromBackend: async () => {
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
              whatsapp: participant.phone,
              university: participant.sb ?? '',
              isIeee: participant.participantType !== 'NonIEEE',
              ieeeId: participant.ieeeId ? String(participant.ieeeId) : '',
              isRas: false,
              status: participant.paid ? 'approved' : 'waiting_for_payment',
              paymentProofSubmitted: false,
              paymentFileName: '',
              participantId: participant.id,
            },
            isRegistered: true,
          });
        } catch {
          // Non-fatal: profile may not exist yet (404), or backend is down.
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
