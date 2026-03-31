import { z } from 'zod';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { RegisterLocalDto, RegisterLocalSchema } from './register-local.dto';
import {
  InternationalInfoDto,
  InternationalInfoSchema,
} from './international-info.dto';

/**
 * Zod schema for profile update validation
 * All fields are optional (partial update)
 */
export const UpdateProfileSchema = RegisterLocalSchema.partial().extend({
  internationalInfo: InternationalInfoSchema.partial().optional(),
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
  /**
   * Nested international info (all fields optional)
   * Only allowed if participant is international
   */
  @IsOptional()
  @IsObject({ message: 'International info must be an object' })
  @ValidateNested()
  @Type(() => PartialInternationalInfoDto)
  internationalInfo?: PartialInternationalInfoDto;
}
