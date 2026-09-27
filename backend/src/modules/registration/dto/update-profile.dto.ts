import { z } from 'zod';
import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsObject, IsOptional, IsPositive, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SB } from '@prisma/client';
import {
  FacebookLinkSchema,
  IeeeIdSchema,
  RegisterLocalDto,
  RegisterLocalSchema,
} from './register-local.dto';
import {
  InternationalInfoDto,
  InternationalInfoBaseSchema,
} from './international-info.dto';

/**
 * Zod schema for profile update validation
 * All fields are optional (partial update)
 * Uses base schema without refinements for .partial() compatibility
 */
export const UpdateProfileSchema = RegisterLocalSchema.partial().extend({
  internationalInfo: InternationalInfoBaseSchema.partial().optional(),
  // May be omitted (participants who registered while it was optional have
  // none), but never cleared: an empty string or null is rejected.
  facebookLink: FacebookLinkSchema.optional(),
  // null removes the member number; the next check then goes by email.
  ieeeId: IeeeIdSchema.nullable().optional(),
  // null removes the student branch.
  sb: z.nativeEnum(SB).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Partial DTO for international info updates
 * All fields are optional
 */
class PartialInternationalInfoDto extends PartialType(InternationalInfoDto) {}

/**
 * DTO for profile update
 * All fields are optional using NestJS PartialType
 */
export class UpdateProfileDto extends PartialType(OmitType(RegisterLocalDto, ['ieeeId', 'sb'] as const)) {
  // The class-validator decorators are required, not decoration: the global
  // ValidationPipe({ whitelist: true }) in main.ts deletes any undecorated
  // property before the Zod pipe runs, which silently dropped these edits.
  // @IsOptional lets null through, which is how each field is removed.
  @ApiPropertyOptional({
    description: 'IEEE member number; null removes it',
    example: 12345678,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: 'IEEE member number must be an integer' })
  @IsPositive({ message: 'IEEE member number must be positive' })
  ieeeId?: number | null;

  @ApiPropertyOptional({ description: 'IEEE student branch; null removes it', enum: SB, nullable: true })
  @IsOptional()
  @IsEnum(SB, { message: 'Invalid student branch' })
  sb?: SB | null;

  @ApiPropertyOptional({
    description: 'International info updates (only for international participants)',
    type: () => PartialInternationalInfoDto,
  })
  @IsOptional()
  @IsObject({ message: 'International info must be an object' })
  @ValidateNested()
  @Type(() => PartialInternationalInfoDto)
  internationalInfo?: PartialInternationalInfoDto;
}
