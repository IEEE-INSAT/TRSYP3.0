import { Controller, Post, Body, UseGuards, Req, Res, HttpStatus, Get } from "@nestjs/common";
import { AdminService } from "../service/admin.service";
import { CreateAdminDto } from "../dto/create-admin.dto";
import { Response } from "express";
import { RequestWithUser } from "../../../common/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { SupabaseAuthGuard } from "../../auth/guards/supabase-auth.guard";
import { AdminGuard } from "../../auth/guards/admin.guard";
import { DeleteAccountDto } from "../dto/delete-account.dto";
@ApiTags('Admin')
@Controller('admin')
export class AdminController{
    constructor(private readonly adminService:AdminService){}

    @Get('me')
    @UseGuards(SupabaseAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify admin status and get admin profile' })
    @ApiResponse({ status: 200, description: 'User is an admin.' })
    @ApiResponse({ status: 401, description: 'Unauthorized - not logged in.' })
    @ApiResponse({ status: 403, description: 'Forbidden - not an admin.' })
    async getMe(@Req() req: RequestWithUser, @Res() res: Response) {
        const admin = await this.adminService.findBySupabaseId(req.user._supabaseId);
        return res.status(HttpStatus.OK).json(admin);
    }

    @Post('create-admin')
    @UseGuards(SupabaseAuthGuard,AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new admin' })
    @ApiResponse({ status: 200, description: 'Admin created successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async createAdmin(@Body() dto:CreateAdminDto,@Res() res:Response){
        const admin=await this.adminService.createAdmin(dto);
        return res.status(HttpStatus.OK).json(admin);
    }

    @Post('delete-account')
    @UseGuards(SupabaseAuthGuard,AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an account' })
    @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async deleteAccount(@Body() dto:DeleteAccountDto,@Res() res:Response){
        const admin=await this.adminService.deleteAccount(dto.supabaseId as string);
        return res.status(HttpStatus.OK).json(admin);
    }
}
