import { z } from 'zod';
import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { RegisterLocalDto, RegisterLocalSchema } from './register-local.dto';
import {
  InternationalInfoDto,
  InternationalInfoSchema,
} from './international-info.dto';

/**
 * Zod schema for international participant registration
 * Combines local registration with international info
 */
export const RegisterInternationalSchema = RegisterLocalSchema.extend({
  internationalInfo: InternationalInfoSchema,
});

export type RegisterInternationalInput = z.infer<typeof RegisterInternationalSchema>;

/**
 * DTO for international participant registration
 * Extends local registration DTO with international info
 */
export class RegisterInternationalDto extends RegisterLocalDto {
  /**
   * Nested international participant information
   */
  @IsObject({ message: 'International info must be an object' })
  @ValidateNested()
  @Type(() => InternationalInfoDto)
  internationalInfo!: InternationalInfoDto;
}
