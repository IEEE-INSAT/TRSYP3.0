import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth-store';
import { registrationService } from '../api/registration.service';
import { ApiError } from '../api/http';
import type {
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
  // Team display (optional)
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
}

interface RegistrationState {
  user: UserData | null;
  isRegistered: boolean;
  submitting: boolean;
  error: string | null;

  registerParticipant: (input: ParticipantRegistrationInput) => Promise<void>;
  submitPayment: (fileName: string) => Promise<void>;
  updateStatus: (status: RegStatus) => void;
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

          // POST /registration — tolerate 409 (already registered).
          if (token) {
            try {
              await registrationService.register(toPayload(input), token);
            } catch (e) {
              if (!(e instanceof ApiError && e.status === 409)) throw e;
            }
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

      reset: () => set({ user: null, isRegistered: false, error: null }),
    }),
    {
      name: 'trsyp_user',
      partialize: (state) => ({ user: state.user, isRegistered: state.isRegistered }),
    },
  ),
);
