import { z } from 'zod';
import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
export class UpdateProfileDto extends PartialType(OmitType(RegisterLocalDto, ['ieeeId'] as const)) {
  @ApiPropertyOptional({
    description: 'IEEE member number; null removes it',
    example: 12345678,
    nullable: true,
  })
  ieeeId?: number | null;

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
