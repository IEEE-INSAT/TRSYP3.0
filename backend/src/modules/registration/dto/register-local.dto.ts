import { z } from 'zod';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
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
});

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
}