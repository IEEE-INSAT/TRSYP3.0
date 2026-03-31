import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SyncUserDto } from "../dto/sync-user.dto";

@Injectable()
export class AuthService{
  constructor(private readonly prisma:PrismaService){}

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
}