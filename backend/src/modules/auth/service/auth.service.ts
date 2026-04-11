import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SyncUserDto } from "../dto/sync-user.dto";
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { ConfigService } from "@nestjs/config";
@Injectable()
export class AuthService{
  private supabase: SupabaseClient;
  constructor(private readonly prisma:PrismaService,
              private readonly configService: ConfigService
  ){
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  async syncUser(supabaseId:string,dto:SyncUserDto){
    const user=await this.prisma.user.upsert({
      where:{supabaseId:supabaseId as string},
      update:{
        email:dto.email as string,
        name:dto.name as string,
        lastName:dto.lastName as string,
        provider:dto.provider ?? "email",
      },
      create:{
        supabaseId:supabaseId as string,
        email:dto.email as string,
        name:dto.name as string,
        lastName:dto.lastName as string,
        provider:dto.provider ?? "email",
      },
    });
    return user;
  }
  async findbySupabaseId(supabaseId:string){
    return this.prisma.user.findUnique({
      where:{supabaseId},
    });
  }
  async resetPassword(email:string){
    const user=await this.prisma.user.findUnique({
      where:{email},
    });
    if(!user){
      throw new Error("User not found");
    }
    const {data,error}=await this.supabase.auth.resetPasswordForEmail(email,{redirectTo: 'http://localhost:3000',});
    if(error){
      throw new Error(error.message);
    }
    return {message:"If an account exists, a password reset email has been sent"};
  }
}