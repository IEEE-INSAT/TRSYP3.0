import { z } from 'zod';
import {
  IsDateString,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * Zod schema for visa application request validation
 * Includes cross-field validation for passport dates
 */
export const RequestVisaSchema = z
  .object({
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
  })
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
  /**
   * Passport number as shown on the passport
   */
  @IsString()
  @MinLength(5, { message: 'Passport number must be at least 5 characters' })
  passportNumber!: string;

  /**
   * Country that issued the passport
   */
  @IsString()
  @MinLength(2, { message: 'Passport issuance country must be at least 2 characters' })
  passportIssuanceCountry!: string;

  /**
   * Office that issued the passport
   */
  @IsString()
  @MinLength(2, { message: 'Issuing office must be at least 2 characters' })
  issuingOffice!: string;

  /**
   * Date when the passport was issued (ISO 8601 format)
   */
  @IsDateString({}, { message: 'Invalid passport issuance date format (use ISO 8601)' })
  passportIssuanceDate!: string;

  /**
   * Date when the passport expires (ISO 8601 format)
   * Must be in the future
   */
  @IsDateString({}, { message: 'Invalid passport expiry date format (use ISO 8601)' })
  passportExpiryDate!: string;

  /**
   * Full address of the embassy where the visa letter should be sent
   */
  @IsString()
  @MinLength(10, { message: 'Embassy address must be at least 10 characters' })
  embassyAddress!: string;

  /**
   * Full residence address of the participant
   */
  @IsString()
  @MinLength(10, { message: 'Residence address must be at least 10 characters' })
  residenceAddress!: string;
}
