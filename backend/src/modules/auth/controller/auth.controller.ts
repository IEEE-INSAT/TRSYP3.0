import { Controller, Post, Body, UseGuards, Req, Res, HttpStatus, Get, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../service/auth.service";
import { SupabaseAuthGuard } from "../guards/supabase-auth.guard";
import { Response, Request } from "express";
import { SyncUserDto } from "../dto/sync-user.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ResetPasswordDto } from "../dto/Reset-password.dto";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('sync-user')
    @UseGuards(SupabaseAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Synchronize user data via Supabase' })
    @ApiResponse({ status: 200, description: 'User successfully synchronized.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async syncUser(@Body() dto: SyncUserDto, @Res() res: Response, @Req() req: Request) {
        const supabaseId = (req.user as any).sub;
        if (!supabaseId) {
            throw new UnauthorizedException('User not found');
        }
        const user = await this.authService.syncUser(supabaseId, dto);
        return res.status(HttpStatus.OK).json(user);
    }

    @Get('me')
    @UseGuards(SupabaseAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async getMe(@Req() req: Request, @Res() res: Response) {
        const user = await this.authService.findbySupabaseId((req.user as any).sub);
        return res.status(HttpStatus.OK).json(user);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Request a password reset email' })
    @ApiResponse({ status: 200, description: 'Password reset email sent.' })
    async Password_reset(@Body() dto:ResetPasswordDto, @Res() res:Response){
        const result = await this.authService.resetPassword(dto.email);
        return res.status(HttpStatus.OK).json(result);
    }
}