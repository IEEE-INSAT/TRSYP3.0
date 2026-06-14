import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth-store';
import { registrationService } from '../api/registration.service';
import type { RegisterParticipantPayload } from '../api/types';

export type UserType = 'participant' | 'challenger';
export type RegStatus =
  | 'waiting_for_payment'
  | 'waiting_for_verification'
  | 'approved';

export interface TeamMember {
  name: string;
  email: string;
  whatsapp: string;
  university: string;
  isIeee: boolean;
  ieeeId: string;
  isRas: boolean;
}

/** The participant/challenger profile that drives the dashboard. */
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
  // Challenger-only
  teamName?: string;
  memberCount?: number;
  members?: TeamMember[];
}

export interface ParticipantRegistrationInput {
  fullName: string;
  email: string;
  whatsapp: string;
  university: string;
  isIeee: boolean;
  ieeeId: string;
  isRas: boolean;
  password: string;
}

export interface ChallengerRegistrationInput extends ParticipantRegistrationInput {
  teamName: string;
  memberCount: number;
  members: TeamMember[];
}

interface RegistrationState {
  user: UserData | null;
  isRegistered: boolean;
  submitting: boolean;
  error: string | null;

  registerParticipant: (input: ParticipantRegistrationInput) => Promise<void>;
  registerChallenger: (input: ChallengerRegistrationInput) => Promise<void>;
  submitPayment: (fileName: string) => Promise<void>;
  updateStatus: (status: RegStatus) => void;
  reset: () => void;
}

function splitName(fullName: string): { name: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const name = parts.shift() ?? '';
  return { name, lastName: parts.join(' ') };
}

/**
 * Maps the V2 form input to the backend RegisterLocalDto.
 *
 * TODO(backend/form): the form does not yet collect `gender`, `participantType`
 * or `country`, and `university` is free text whereas the backend `sb` field is
 * an enum. These placeholders only travel to the server once
 * `features.registrationApi` is enabled — close the gaps (add the fields to the
 * form / relax the backend enum) before flipping the flag.
 */
function toRegisterPayload(
  input: ParticipantRegistrationInput,
): RegisterParticipantPayload {
  return {
    ieeeId: input.isIeee && input.ieeeId ? Number(input.ieeeId) : undefined,
    phone: input.whatsapp,
    gender: 'male',
    participantType: input.isIeee ? 'Student' : 'NonIEEE',
    sb: input.university,
    country: 'Tunisia',
  };
}

/**
 * Registration store — the source of truth for the signed-in participant's own
 * profile. Persisted to localStorage so the dashboard survives reloads while
 * the backend registration module is still a placeholder.
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
          const { name, lastName } = splitName(input.fullName);
          await useAuthStore
            .getState()
            .signUp({ email: input.email, password: input.password, name, lastName });

          const token = await useAuthStore.getState().getAccessToken();
          if (token) await registrationService.register(toRegisterPayload(input), token);

          set({
            user: {
              userType: 'participant',
              fullName: input.fullName,
              email: input.email,
              whatsapp: input.whatsapp,
              university: input.university,
              isIeee: input.isIeee,
              ieeeId: input.ieeeId,
              isRas: input.isRas,
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

      registerChallenger: async (input) => {
        set({ submitting: true, error: null });
        try {
          // Per current scope the team leader registers as a normal participant;
          // the full team is kept client-side until the backend models teams.
          const { name, lastName } = splitName(input.fullName);
          await useAuthStore
            .getState()
            .signUp({ email: input.email, password: input.password, name, lastName });

          const token = await useAuthStore.getState().getAccessToken();
          if (token) await registrationService.register(toRegisterPayload(input), token);

          set({
            user: {
              userType: 'challenger',
              fullName: input.fullName,
              email: input.email,
              whatsapp: input.whatsapp,
              university: input.university,
              isIeee: input.isIeee,
              ieeeId: input.ieeeId,
              isRas: input.isRas,
              status: 'waiting_for_payment',
              paymentProofSubmitted: false,
              paymentFileName: '',
              teamName: input.teamName,
              memberCount: input.memberCount,
              members: input.members,
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
