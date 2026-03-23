import { Participant } from './participant.entity';
import { VisaApplication } from '../../visa/entities/visa-application.entity';

export class InternationalInfo {
  dateOfBirth!: Date;
  countryOfResidence!: string;
  cityOfResidence!: string;
  affiliation!: string;
  expectedArrivalDate!: Date;
  expectedDepartureDate!: Date;
  requiresVisaLetter!: boolean;

  // Participant "1" -- "0..1" InternationalInfo
  participant!: Participant;

  // InternationalInfo "1" -- "0..1" VisaApplication
  visaApplication?: VisaApplication;
}
