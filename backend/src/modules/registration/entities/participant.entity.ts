import { User } from '../../auth/entities/user.entity';
import type { InternationalInfo } from './international-participant.entity';
import { SB, Country, ParticipantType } from '../domain/registration.types';
import { Payment } from '../../payment/entities/payment.entity';

export class Participant extends User {
  ieeeId!: number;
  phone!: string;
  gender!: string;
  paid!: boolean;
  isInternational!: boolean;
  banned!: boolean;
  sb!: SB;
  country!: Country;
  participantType!: ParticipantType;
  // Participant "1" -- "0..1" InternationalInfo
  internationalInfo?: InternationalInfo;
  // Participant "1" -- "0..1" Payment
  payment?: Payment;
}
