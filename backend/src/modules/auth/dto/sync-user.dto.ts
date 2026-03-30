import { IsString,IsEmail,IsOptional, isString } from "class-validator";
import { StringSchema } from "joi";

export class SyncUserDto{

    @IsString()
    supabaseId:string | undefined;

    @IsEmail()
    email:string | undefined;

    @IsString()
    name:string | undefined;

    @IsString()
    lastName:string | undefined;

    @IsString()
    @IsOptional()
    provider:string | undefined;
    
   
}