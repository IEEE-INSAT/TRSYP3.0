import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Self-service identity edit.
 *
 * Deliberately limited to the display name: `email` is the Supabase auth
 * identity and can only be changed through Supabase's own confirmation flow,
 * so accepting it here would let `public.users` drift from `auth.users`.
 */
export class UpdateMeDto {
    @ApiPropertyOptional({ example: 'Amina' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ example: 'Ben Salah' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName?: string;
}
