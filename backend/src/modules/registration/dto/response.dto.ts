import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipantType, SB, COUNTRY, VisaStatus } from '@prisma/client';

/**
 * Response DTO for visa application
 * Excludes sensitive internal fields
 */
export class VisaApplicationResponseDto {
  @ApiProperty({ description: 'Visa application ID', format: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Passport number' })
  @Expose()
  passportNumber!: string;

  @ApiProperty({ description: 'Country that issued the passport' })
  @Expose()
  passportIssuanceCountry!: string;

  @ApiProperty({ description: 'Issuing office' })
  @Expose()
  issuingOffice!: string;

  @ApiProperty({ description: 'Passport issuance date', format: 'date-time' })
  @Expose()
  passportIssuanceDate!: Date;

  @ApiProperty({ description: 'Passport expiry date', format: 'date-time' })
  @Expose()
  passportExpiryDate!: Date;

  @ApiProperty({ description: 'Embassy address for letter delivery' })
  @Expose()
  embassyAddress!: string;

  @ApiProperty({ description: 'Participant residence address' })
  @Expose()
  residenceAddress!: string;

  @ApiProperty({ description: 'Visa application status', enum: VisaStatus })
  @Expose()
  status!: VisaStatus;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  @Expose()
  updatedAt!: Date;
}

/**
 * Response DTO for international info
 */
export class InternationalInfoResponseDto {
  @ApiProperty({ description: 'International info ID', format: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Date of birth', format: 'date-time' })
  @Expose()
  dateOfBirth!: Date;

  @ApiProperty({ description: 'Country of residence' })
  @Expose()
  countryOfResidence!: string;

  @ApiProperty({ description: 'City of residence' })
  @Expose()
  cityOfResidence!: string;

  @ApiProperty({ description: 'Organization affiliation' })
  @Expose()
  affiliation!: string;

  @ApiProperty({ description: 'Expected arrival date', format: 'date-time' })
  @Expose()
  expectedArrivalDate!: Date;

  @ApiProperty({ description: 'Expected departure date', format: 'date-time' })
  @Expose()
  expectedDepartureDate!: Date;

  @ApiProperty({ description: 'Whether visa letter is required' })
  @Expose()
  requiresVisaLetter!: boolean;

  @ApiPropertyOptional({ description: 'Visa application if submitted', type: () => VisaApplicationResponseDto })
  @Expose()
  @Type(() => VisaApplicationResponseDto)
  visaApplication?: VisaApplicationResponseDto;
}

/**
 * Response DTO for participant profile
 * Excludes sensitive fields: paid, banned (internal state)
 */
export class ParticipantResponseDto {
  @ApiProperty({ description: 'Participant ID', format: 'uuid' })
  @Expose()
  id!: string;

  @ApiPropertyOptional({ description: 'IEEE member ID' })
  @Expose()
  ieeeId?: number;

  @ApiProperty({ description: 'Phone number in E.164 format' })
  @Expose()
  phone!: string;

  @ApiProperty({ description: 'Gender', enum: ['male', 'female'] })
  @Expose()
  gender!: string;

  @ApiProperty({ description: 'Whether participant is international' })
  @Expose()
  isInternational!: boolean;

  @ApiProperty({ description: 'Participant type', enum: ParticipantType })
  @Expose()
  participantType!: ParticipantType;

  @ApiPropertyOptional({ description: 'Student branch', enum: SB })
  @Expose()
  sb?: SB;

  @ApiProperty({ description: 'Country of origin', enum: COUNTRY })
  @Expose()
  country!: COUNTRY;

  @ApiProperty({ description: 'Registration timestamp', format: 'date-time' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  @Expose()
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'International info if applicable', type: () => InternationalInfoResponseDto })
  @Expose()
  @Type(() => InternationalInfoResponseDto)
  internationalInfo?: InternationalInfoResponseDto;

  // Internal fields - excluded from response
  @Exclude()
  paid!: boolean;

  @Exclude()
  banned!: boolean;

  @Exclude()
  userId!: string;
}

/**
 * Response DTO for admin view of participant
 * Includes all fields including internal state
 */
export class ParticipantAdminResponseDto extends ParticipantResponseDto {
  @ApiProperty({ description: 'Payment status' })
  @Expose()
  override paid!: boolean;

  @ApiProperty({ description: 'Ban status' })
  @Expose()
  override banned!: boolean;

  @ApiProperty({ description: 'Associated user ID', format: 'uuid' })
  @Expose()
  override userId!: string;
}

/**
 * Response DTO for list operations with pagination
 */
export class ParticipantListResponseDto {
  @ApiProperty({ description: 'List of participants', type: [ParticipantResponseDto] })
  @Expose()
  @Type(() => ParticipantResponseDto)
  data!: ParticipantResponseDto[];

  @ApiProperty({ description: 'Total number of participants matching filters' })
  @Expose()
  total!: number;

  @ApiProperty({ description: 'Number of items skipped' })
  @Expose()
  skip!: number;

  @ApiProperty({ description: 'Number of items returned' })
  @Expose()
  take!: number;
}
