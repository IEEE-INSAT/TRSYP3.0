import { z } from 'zod';
import {
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
import { CareerStage, SB, COUNTRY } from '@prisma/client';

/**
 * A facebook.com / fb.com profile URL. Empty, missing and null are all
 * rejected as "required" rather than treated as "not provided".
 */
export const FacebookLinkSchema = z
  .string({ error: 'Facebook link is required' })
  .trim()
  .min(1, { message: 'Facebook link is required', abort: true })
  .max(255, { message: 'Facebook link is too long' })
  .url({ message: 'Facebook link must be a valid URL', abort: true })
  .refine((v) => isFacebookUrl(v), { message: 'Facebook link must point to facebook.com' });

/** True when the URL's host is facebook.com or fb.com (any subdomain). */
export function isFacebookUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return ['facebook.com', 'fb.com'].some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/**
 * Zod schema for local participant registration validation
 */
/**
 * IEEE member number. Optional for everyone: it is only a lookup key, the most
 * precise one (email is the fallback). Membership and RAS are never asked -
 * they come from IEEE's records.
 */
export const IeeeIdSchema = z
  .number()
  .int()
  .positive({ message: 'IEEE member number must be a positive integer' });

export const RegisterLocalSchema = z.object({
  ieeeId: IeeeIdSchema.optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Phone must be in E.164 format' }),
  gender: z.enum(['male', 'female'], {
    message: "Gender must be 'male' or 'female'",
  }),
  careerStage: z.nativeEnum(CareerStage),
  // Required for students - the service checks it against `careerStage`.
  sb: z.nativeEnum(SB).optional(),
  country: z.nativeEnum(COUNTRY),
  // Required for new registrations. Participants who registered while it was
  // optional keep a null column - see UpdateProfileSchema for how edits treat it.
  facebookLink: FacebookLinkSchema,
});


export type RegisterLocalInput = z.infer<typeof RegisterLocalSchema>;

/**
 * DTO for local participant registration
 * Used with class-validator for NestJS validation pipe
 */
export class RegisterLocalDto {
  @ApiPropertyOptional({
    description: 'IEEE member number, used to look the participant up in IEEE\'s records (email is the fallback)',
    example: 12345678,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'IEEE member number must be an integer' })
  @IsPositive({ message: 'IEEE member number must be positive' })
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
    description: 'Student or young professional, as the participant answers it. IEEE membership is not asked: it comes from IEEE\'s records.',
    enum: CareerStage,
    example: 'Student',
  })
  @IsEnum(CareerStage, {
    message: 'Invalid career stage',
  })
  careerStage!: CareerStage;

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

  @ApiProperty({
    description: 'Facebook profile URL (facebook.com or fb.com)',
    example: 'https://www.facebook.com/john.doe',
    maxLength: 255,
  })
  @IsString({ message: 'Facebook link is required' })
  @IsUrl({}, { message: 'Facebook link must be a valid URL' })
  @MaxLength(255, { message: 'Facebook link is too long' })
  facebookLink!: string;
}