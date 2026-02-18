import { VisaStatus } from '../domain/visa.types';

export class VisaApplication {
  id!: string;
  passportNumber!: string;
  passportIssuanceCountry!: string;
  issuingOffice!: string;
  passportIssuanceDate!: Date;
  passportExpiryDate!: Date;
  embassyAddress!: string;
  residenceAddress!: string;
  status!: VisaStatus;
}
