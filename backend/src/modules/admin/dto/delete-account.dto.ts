import { IsString } from "class-validator";
export class DeleteAccountDto {
    @IsString()
    supabaseId:string | undefined;
}