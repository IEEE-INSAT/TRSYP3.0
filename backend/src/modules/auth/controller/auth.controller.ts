import { Controller, Post, Body, UseGuards, Req, Res, HttpStatus, Get, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { AuthService } from "../service/auth.service";
import { SupabaseAuthGuard } from "../guards/supabase-auth.guard";
import { Response, Request } from "express";
import { SyncUserDto } from "../dto/sync-user.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { ResetPasswordDto } from "../dto/Reset-password.dto";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";

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
    @ApiResponse({ status: 429, description: 'Too many requests.' })
    async syncUser(@Body() dto: SyncUserDto, @Res() res: Response, @Req() req: Request) {
        const payload = req.user as any;
        // _supabaseId is always the original Supabase UUID (set by the JWT strategy).
        const supabaseId = payload._supabaseId;
        if (!supabaseId) {
            throw new UnauthorizedException('User not found');
        }
        const user = await this.authService.syncUser(supabaseId, dto);
        return res.status(HttpStatus.OK).json(user);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 429, description: 'Too many requests.' })
    async getMe(@Req() req: Request, @Res() res: Response) {
        const user = await this.authService.findbySupabaseId((req.user as any)._supabaseId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return res.status(HttpStatus.OK).json(user);
    }

    @Post('reset-password')
    // Strict rate limit: 3 requests per 15 minutes per IP.
    // Prevents brute-force user enumeration and Supabase API abuse.
    @Throttle({ default: { ttl: 900000, limit: 3 } })
    @ApiOperation({ summary: 'Request a password reset email' })
    @ApiResponse({ status: 200, description: 'Password reset email sent.' })
    @ApiResponse({ status: 429, description: 'Too many requests. Try again later.' })
    async Password_reset(@Body() dto:ResetPasswordDto, @Res() res:Response){
        const result = await this.authService.resetPassword(dto.email);
        return res.status(HttpStatus.OK).json(result);
    }
}