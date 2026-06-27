import { IsString, IsEmail, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SyncUserDto {
    @ApiProperty({ example: 'user@example.com', description: 'The user email address' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'John', description: 'The first name of the user' })
    @IsString()
    name!: string;

    @ApiProperty({ example: 'Doe', description: 'The last name of the user' })
    @IsString()
    lastName!: string;

    @ApiPropertyOptional({ example: 'google', description: 'The authentication provider' })
    @IsString()
    @IsOptional()
    provider?: string;
}