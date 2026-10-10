import { Participant } from '../../registration/entities/participant.entity';

export class Room {
  roomId!: string;
  code!: string;
  gender!: string;

  // Room "1" -- "1" Participant : Owner
  owner!: Participant;

  // Room "1" -- "1..2" Participant : Residents (owner included)
  residents!: Participant[];
}
