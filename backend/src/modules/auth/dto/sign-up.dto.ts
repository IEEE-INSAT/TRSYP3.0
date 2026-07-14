import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class SignUpDto {
    @ApiProperty({ example: 'participant@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'Example!2026' })
    @IsString()
    @MinLength(8)
    @Matches(/[A-Z]/)
    @Matches(/[a-z]/)
    @Matches(/\d/)
    @Matches(/[^A-Za-z0-9]/)
    password!: string;

    @ApiProperty({ example: 'Amina' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name!: string;

    @ApiProperty({ example: 'Ben Salah' })
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;
}
