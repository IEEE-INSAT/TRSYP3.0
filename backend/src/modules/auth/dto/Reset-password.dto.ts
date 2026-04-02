import { IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'The user email address' })
    @IsEmail()
    email!: string;
}