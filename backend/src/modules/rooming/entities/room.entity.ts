import { Participant } from '../../registration/entities/participant.entity';
import { Invitation } from './invitation.entity';

export class Room {
  roomId!: string;
  size!: number;
  confirmed!: boolean;

  // Room "1" -- "1" Participant : Owner
  owner!: Participant;

  // Room "1" -- "0..*" Participant : Residents
  residents!: Participant[];

  // Room "1" -- "0..*" Invitation
  invitations!: Invitation[];
}
