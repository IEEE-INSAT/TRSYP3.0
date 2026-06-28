
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { AdminService } from "../../admin/service/admin.service";
import { Injectable } from "@nestjs/common";
@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly adminService: AdminService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return false;
        }

        // Use _supabaseId (the original Supabase UUID preserved by the JWT
        // strategy), NOT user.sub which has been remapped to the internal DB ID.
        const admin = await this.adminService.findBySupabaseId(user._supabaseId);
        return !!admin;
    }
}