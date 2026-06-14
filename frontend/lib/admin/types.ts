/**
 * Admin-view domain types.
 *
 * These describe the shape the admin UI works with today (sourced from local
 * placeholder data). Once `/registration/admin/*` is live they will be produced
 * by mapping the backend `Participant` responses — see `admin.service.ts`.
 */

export type AdminStatus =
  | 'waiting_for_payment'
  | 'waiting_for_verification'
  | 'approved'
  | 'rejected';

export interface AdminParticipant {
  id: string;
  fullName: string;
  email: string;
  password: string;
  whatsapp: string;
  university: string;
  ieeeMember: boolean;
  ieeeId: string | null;
  rasMember: boolean;
  status: AdminStatus;
  registeredAt: string;
  paymentProof: string | null;
  paymentProofSubmittedAt: string | null;
}

export interface ChallengerMember {
  fullName: string;
  email: string;
  whatsapp: string;
  university: string;
  ieeeMember: boolean;
  ieeeId: string | null;
  rasMember: boolean;
}

export interface AdminChallenger {
  id: string;
  teamName: string;
  leader: {
    fullName: string;
    email: string;
    password: string;
    whatsapp: string;
    university: string;
    ieeeMember: boolean;
    ieeeId: string | null;
    rasMember: boolean;
  };
  members: ChallengerMember[];
  status: AdminStatus;
  registeredAt: string;
  paymentProof: string | null;
  paymentProofSubmittedAt: string | null;
}

export interface AdminRegistrations {
  participants: AdminParticipant[];
  challengers: AdminChallenger[];
}
