import { z } from 'zod';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base Zod schema for international participant info (without refinements)
 * Used for partial updates where cross-field validation isn't needed
 */
export const InternationalInfoBaseSchema = z.object({
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
});

/**
 * Zod schema for international participant info validation
 * Includes cross-field validation for date ranges
 */
export const InternationalInfoSchema = InternationalInfoBaseSchema.refine(
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
  @ApiProperty({
    description: 'Date of birth (ISO 8601 format)',
    example: '1995-06-15',
    format: 'date',
  })
  @IsDateString({}, { message: 'Invalid date of birth format (use ISO 8601)' })
  dateOfBirth!: string;

  @ApiProperty({
    description: 'Country where the participant currently resides',
    example: 'Algeria',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'Country of residence must be at least 2 characters' })
  countryOfResidence!: string;

  @ApiProperty({
    description: 'City where the participant currently resides',
    example: 'Algiers',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'City of residence must be at least 2 characters' })
  cityOfResidence!: string;

  @ApiProperty({
    description: 'Organization or university affiliation',
    example: 'University of Algiers',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'Affiliation must be at least 2 characters' })
  affiliation!: string;

  @ApiProperty({
    description: 'Expected arrival date at the congress (ISO 8601)',
    example: '2026-07-15',
    format: 'date',
  })
  @IsDateString({}, { message: 'Invalid expected arrival date format (use ISO 8601)' })
  expectedArrivalDate!: string;

  @ApiProperty({
    description: 'Expected departure date (must be after arrival)',
    example: '2026-07-20',
    format: 'date',
  })
  @IsDateString({}, { message: 'Invalid expected departure date format (use ISO 8601)' })
  expectedDepartureDate!: string;

  @ApiPropertyOptional({
    description: 'Whether a visa invitation letter is required',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'requiresVisaLetter must be a boolean' })
  requiresVisaLetter?: boolean;
}
