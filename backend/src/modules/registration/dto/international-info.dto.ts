import { z } from 'zod';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Zod schema for international participant info validation
 * Includes cross-field validation for date ranges
 */
export const InternationalInfoSchema = z
  .object({
    dateOfBirth: z.coerce.date({
      message: 'Invalid date of birth format',
    }),
    countryOfResidence: z
      .string()
      .min(2, { message: 'Country of residence must be at least 2 characters' }),
    cityOfResidence: z
      .string()
      .min(2, { message: 'City of residence must be at least 2 characters' }),
    affiliation: z
      .string()
      .min(2, { message: 'Affiliation must be at least 2 characters' }),
    expectedArrivalDate: z.coerce.date({
      message: 'Invalid expected arrival date format',
    }),
    expectedDepartureDate: z.coerce.date({
      message: 'Invalid expected departure date format',
    }),
    requiresVisaLetter: z.boolean().default(false),
  })
  .refine(
    (data) => data.expectedDepartureDate > data.expectedArrivalDate,
    {
      message: 'Expected departure date must be after expected arrival date',
      path: ['expectedDepartureDate'],
    },
  );

export type InternationalInfoInput = z.infer<typeof InternationalInfoSchema>;

/**
 * DTO for international participant info
 * Used with class-validator for NestJS validation pipe
 */
export class InternationalInfoDto {
  /**
   * Participant's date of birth (ISO 8601 format)
   */
  @IsDateString({}, { message: 'Invalid date of birth format (use ISO 8601)' })
  dateOfBirth!: string;

  /**
   * Country where the participant currently resides
   */
  @IsString()
  @MinLength(2, { message: 'Country of residence must be at least 2 characters' })
  countryOfResidence!: string;

  /**
   * City where the participant currently resides
   */
  @IsString()
  @MinLength(2, { message: 'City of residence must be at least 2 characters' })
  cityOfResidence!: string;

  /**
   * Participant's organization or university affiliation
   */
  @IsString()
  @MinLength(2, { message: 'Affiliation must be at least 2 characters' })
  affiliation!: string;

  /**
   * Expected arrival date at the congress (ISO 8601 format)
   */
  @IsDateString({}, { message: 'Invalid expected arrival date format (use ISO 8601)' })
  expectedArrivalDate!: string;

  /**
   * Expected departure date from the congress (ISO 8601 format)
   * Must be after expectedArrivalDate
   */
  @IsDateString({}, { message: 'Invalid expected departure date format (use ISO 8601)' })
  expectedDepartureDate!: string;

  /**
   * Whether the participant requires a visa invitation letter
   */
  @IsOptional()
  @IsBoolean({ message: 'requiresVisaLetter must be a boolean' })
  requiresVisaLetter?: boolean;
}
