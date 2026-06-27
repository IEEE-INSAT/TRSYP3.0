import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SyncUserDto } from "../dto/sync-user.dto";
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { ConfigService } from "@nestjs/config";
@Injectable()
export class AuthService{
  private readonly logger = new Logger(AuthService.name);
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

  async syncUser(supabaseId: string, dto: SyncUserDto, emailConfirmed: boolean) {
    this.logger.log(`syncUser called — supabaseId=${supabaseId}, email=${dto.email}, name=${dto.name}, lastName=${dto.lastName}, provider=${dto.provider}, emailConfirmed=${emailConfirmed}`);
    try {
      const user = await this.prisma.user.upsert({
        where: { supabaseId },
        update: {
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          provider: dto.provider ?? 'email',
          active: emailConfirmed,
        },
        create: {
          supabaseId,
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          provider: dto.provider ?? 'email',
          active: emailConfirmed,
        },
      });
      this.logger.log(`syncUser success — userId=${user.id}`);
      return user;
    } catch (error: any) {
      // P2002 = unique constraint violation.
      // If the conflict is on `email`, a row already exists with this email
      // but a different supabaseId (e.g. user re-registered in Supabase).
      // Adopt the existing row by updating it with the new supabaseId.
      if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
        this.logger.warn(`Email ${dto.email} already exists — linking to new supabaseId=${supabaseId}`);
        const user = await this.prisma.user.update({
          where: { email: dto.email },
          data: {
            supabaseId,
            name: dto.name,
            lastName: dto.lastName,
            provider: dto.provider ?? 'email',
            active: emailConfirmed,
          },
        });
        this.logger.log(`syncUser (email fallback) success — userId=${user.id}`);
        return user;
      }
      this.logger.error(`syncUser failed for supabaseId=${supabaseId}`, error instanceof Error ? error.stack : error);
      throw error;
    }
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