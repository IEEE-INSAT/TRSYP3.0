import { IsEmail, IsString, IsEnum } from "class-validator";
import { Position } from "@prisma/client";

export class CreateAdminDto {
    @IsEmail()
    email:string | undefined;
    @IsString()
    password:string | undefined     ;
    @IsString()
    name:string | undefined;
    @IsString()
    lastName:string | undefined;
    @IsEnum(Position)
    position:Position | undefined;
}