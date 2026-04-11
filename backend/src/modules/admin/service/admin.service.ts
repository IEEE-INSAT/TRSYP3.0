import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { createClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";
import { CreateAdminDto } from "../dto/create-admin.dto";
@Injectable()
export class AdminService{
    constructor(private readonly prisma:PrismaService,private readonly configService:ConfigService){}
    private supabaseAdmin=createClient(
        this.configService.get<string>('SUPABASE_URL')!,
        this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
        {
            auth:{autoRefreshToken:false,persistSession:false}
        }
    )
    async createAdmin(dto:CreateAdminDto){
        const {data,error}=await this.supabaseAdmin.auth.admin.createUser({
            email: dto.email as string,
            password: dto.password as string,
            email_confirm: true, // Optional: auto confirm their email
            user_metadata: {
                name: dto.name,
                lastName: dto.lastName,
                position: dto.position,
            }
        });

        if (error) {
            throw new Error(`Failed to create admin in Supabase: ${error.message}`);
        }

        if (!data.user) {
            throw new Error('Supabase returned no user data');
        }

        // Save into Prisma Admin table
        const newAdmin = await this.prisma.admin.create({
            data: {
                supabaseId: data.user.id,
                email: dto.email as string,
                name: dto.name as string,
                lastName: dto.lastName as string,
                position: dto.position as any,
            }
        });

        await this.supabaseAdmin.auth.admin.updateUserById(data.user.id, {
            app_metadata: { role: 'admin' }
        });

        return newAdmin;
    }
    async findBySupabaseId(supabaseId: string) {
        return this.prisma.admin.findUnique({
            where: { supabaseId }
        });
    }
    async deleteAccount(supabaseId: string) {
        // Delete from Supabase Auth first
        const { error } = await this.supabaseAdmin.auth.admin.deleteUser(supabaseId);
        if (error) {
            throw new Error(`Failed to delete user from Supabase: ${error.message}`);
        }
        // Then delete from Prisma
        const deletedUser = await this.prisma.user.delete({
            where: { supabaseId },
        });
        return { message: 'Account deleted successfully', user: deletedUser };
    }
}