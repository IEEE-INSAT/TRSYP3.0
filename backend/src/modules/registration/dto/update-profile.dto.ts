import { z } from 'zod';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegisterLocalDto, RegisterLocalSchema } from './register-local.dto';
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
 * Note: participantType, sb, and country cannot be changed after registration
 * (enforced at service level)
 */
export class UpdateProfileDto extends PartialType(RegisterLocalDto) {
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
