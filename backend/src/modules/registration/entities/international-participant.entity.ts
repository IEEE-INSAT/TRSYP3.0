import { Participant } from './participant.entity';
import { VisaApplication } from '../../visa/entities/visa-application.entity';

export class InternationalParticipant extends Participant {
  dateOfBirth!: Date;
  countryOfResidence!: string;
  cityOfResidence!: string;
  affiliation!: string;
  expectedArrivalDate!: Date;
  expectedDepartureDate!: Date;
  requiresVisaLetter!: boolean;

  // InternationalParticipant "1" -- "0..1" VisaApplication
  visaApplication?: VisaApplication;
}
