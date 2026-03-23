import { Participant } from '../../registration/entities/participant.entity';
import { InvitationStatus } from '../domain/rooming.types';

export class Invitation {
  id!: string;
  timestamp!: Date;

  // Invitation "1" -- "1" Participant : guest
  guest!: Participant;

  // Invitation "1" --> "1" InvitationStatus
  status!: InvitationStatus;
}