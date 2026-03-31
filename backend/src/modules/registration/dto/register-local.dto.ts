import { z } from 'zod';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';
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
});

export type RegisterLocalInput = z.infer<typeof RegisterLocalSchema>;

/**
 * DTO for local participant registration
 * Used with class-validator for NestJS validation pipe
 */
export class RegisterLocalDto {
  /**
   * IEEE member ID (optional, only for IEEE members)
   */
  @IsOptional()
  @IsInt({ message: 'IEEE ID must be an integer' })
  @IsPositive({ message: 'IEEE ID must be positive' })
  ieeeId?: number;

  /**
   * Phone number in E.164 format
   */
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be in E.164 format (e.g., +21612345678)',
  })
  phone!: string;

  /**
   * Participant gender
   */
  @IsString()
  @Matches(/^(male|female)$/, {
    message: "Gender must be 'male' or 'female'",
  })
  gender!: string;

  /**
   * Type of participant (NonIEEE, Student, YoungProfessional)
   */
  @IsEnum(ParticipantType, {
    message: 'Invalid participant type',
  })
  participantType!: ParticipantType;

  /**
   * Student branch (optional)
   */
  @IsOptional()
  @IsEnum(SB, { message: 'Invalid student branch' })
  sb?: SB;

  /**
   * Country of origin
   */
  @IsEnum(COUNTRY, { message: 'Invalid country' })
  country!: COUNTRY;
}
