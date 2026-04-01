import { z } from 'zod';
import {
  IsDateString,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Zod schema for visa application (without refinements)
 * Used for partial updates
 */
export const RequestVisaBaseSchema = z.object({
  passportNumber: z
    .string()
    .min(5, { message: 'Passport number must be at least 5 characters' }),
  passportIssuanceCountry: z
    .string()
    .min(2, { message: 'Passport issuance country must be at least 2 characters' }),
  issuingOffice: z
    .string()
    .min(2, { message: 'Issuing office must be at least 2 characters' }),
  passportIssuanceDate: z.coerce.date({
    message: 'Invalid passport issuance date format',
  }),
  passportExpiryDate: z.coerce.date({
    message: 'Invalid passport expiry date format',
  }),
  embassyAddress: z
    .string()
    .min(10, { message: 'Embassy address must be at least 10 characters' }),
  residenceAddress: z
    .string()
    .min(10, { message: 'Residence address must be at least 10 characters' }),
});

/**
 * Zod schema for visa application request validation
 * Includes cross-field validation for passport dates
 */
export const RequestVisaSchema = RequestVisaBaseSchema
  .refine(
    (data) => data.passportExpiryDate > new Date(),
    {
      message: 'Passport expiry date must be in the future',
      path: ['passportExpiryDate'],
    },
  )
  .refine(
    (data) => data.passportIssuanceDate < data.passportExpiryDate,
    {
      message: 'Passport issuance date must be before expiry date',
      path: ['passportIssuanceDate'],
    },
  );

export type RequestVisaInput = z.infer<typeof RequestVisaSchema>;

/**
 * DTO for visa application request
 * All passport and address fields required
 */
export class RequestVisaDto {
  @ApiProperty({
    description: 'Passport number as shown on the document',
    example: 'AB1234567',
    minLength: 5,
  })
  @IsString()
  @MinLength(5, { message: 'Passport number must be at least 5 characters' })
  passportNumber!: string;

  @ApiProperty({
    description: 'Country that issued the passport',
    example: 'Algeria',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'Passport issuance country must be at least 2 characters' })
  passportIssuanceCountry!: string;

  @ApiProperty({
    description: 'Office that issued the passport',
    example: 'Algiers Central Office',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'Issuing office must be at least 2 characters' })
  issuingOffice!: string;

  @ApiProperty({
    description: 'Date when the passport was issued (ISO 8601)',
    example: '2020-01-15',
    format: 'date',
  })
  @IsDateString({}, { message: 'Invalid passport issuance date format (use ISO 8601)' })
  passportIssuanceDate!: string;

  @ApiProperty({
    description: 'Date when the passport expires (must be in the future)',
    example: '2030-01-15',
    format: 'date',
  })
  @IsDateString({}, { message: 'Invalid passport expiry date format (use ISO 8601)' })
  passportExpiryDate!: string;

  @ApiProperty({
    description: 'Full address of the embassy for visa letter delivery',
    example: '18 Avenue de la République, Tunis 1000, Tunisia',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'Embassy address must be at least 10 characters' })
  embassyAddress!: string;

  @ApiProperty({
    description: 'Full residence address of the participant',
    example: '123 Rue Didouche Mourad, Algiers 16000, Algeria',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: 'Residence address must be at least 10 characters' })
  residenceAddress!: string;
}
