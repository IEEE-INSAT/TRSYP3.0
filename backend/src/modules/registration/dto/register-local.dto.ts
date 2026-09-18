import { z } from 'zod';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipantType, SB, COUNTRY } from '@prisma/client';

/**
 * Zod schema for local participant registration validation
 */
export const RegisterLocalSchema = z.object({
  ieeeId: z
    .number()
    .int()
    .positive({ message: 'IEEE ID must be a positive integer' })
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Phone must be in E.164 format' }),
  gender: z.enum(['male', 'female'], {
    message: "Gender must be 'male' or 'female'",
  }),
  participantType: z.nativeEnum(ParticipantType),
  sb: z.nativeEnum(SB).optional(),
  country: z.nativeEnum(COUNTRY),
  // RAS is an IEEE society, so this only ever applies to IEEE members.
  // Absent means "no" - the service normalises it.
  isRas: z.boolean().optional(),
  // Optional profile URL. null or an empty string from a cleared form field
  // is treated as "not provided" so it clears the column instead of failing.
  facebookLink: z.preprocess(
    (v) => (v === null || (typeof v === 'string' && v.trim() === '') ? undefined : v),
    z
      .string()
      .trim()
      .max(255, { message: 'Facebook link is too long' })
      .url({ message: 'Facebook link must be a valid URL' })
      .refine(isFacebookUrl, { message: 'Facebook link must point to facebook.com' })
      .optional(),
  ),
});

/** True when the URL's host is facebook.com or fb.com (any subdomain). */
export function isFacebookUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ['facebook.com', 'fb.com'].some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export type RegisterLocalInput = z.infer<typeof RegisterLocalSchema>;

/**
 * DTO for local participant registration
 * Used with class-validator for NestJS validation pipe
 */
export class RegisterLocalDto {
  @ApiPropertyOptional({
    description: 'IEEE member ID (only for IEEE members)',
    example: 12345678,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'IEEE ID must be an integer' })
  @IsPositive({ message: 'IEEE ID must be positive' })
  ieeeId?: number;

  @ApiProperty({
    description: 'Phone number in E.164 format',
    example: '+21612345678',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be in E.164 format (e.g., +21612345678)',
  })
  phone!: string;

  @ApiProperty({
    description: 'Participant gender',
    enum: ['male', 'female'],
    example: 'male',
  })
  @IsString()
  @Matches(/^(male|female)$/, {
    message: "Gender must be 'male' or 'female'",
  })
  gender!: string;

  @ApiProperty({
    description: 'Type of participant',
    enum: ParticipantType,
    example: 'Student',
  })
  @IsEnum(ParticipantType, {
    message: 'Invalid participant type',
  })
  participantType!: ParticipantType;

  @ApiPropertyOptional({
    description: 'Student branch (for students only)',
    enum: SB,
    example: 'INSAT',
  })
  @IsOptional()
  @IsEnum(SB, { message: 'Invalid student branch' })
  sb?: SB;

  @ApiProperty({
    description: 'Country of origin',
    enum: COUNTRY,
    example: 'Tunisia',
  })
  @IsEnum(COUNTRY, { message: 'Invalid country' })
  country!: COUNTRY;

  @ApiPropertyOptional({
    description: 'IEEE RAS society membership (IEEE members only)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'RAS membership must be a boolean' })
  isRas?: boolean;

  @ApiPropertyOptional({
    description: 'Facebook profile URL',
    example: 'https://www.facebook.com/john.doe',
    maxLength: 255,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Facebook link must be a valid URL' })
  @MaxLength(255, { message: 'Facebook link is too long' })
  facebookLink?: string;
}