import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    Res,
    HttpStatus,
    Get,
    Patch,
    NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { Response } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AvatarDto, ResetPasswordDto, SignUpDto, UpdateMeDto } from '../dto';
import {
    JwtAuthGuard,
    RequestWithUser,
} from '@common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 429, description: 'Too many requests.' })
    async getMe(@Req() req: RequestWithUser, @Res() res: Response) {
        const user = await this.authService.findbySupabaseId(
            req.user._supabaseId,
        );
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return res.status(HttpStatus.OK).json(user);
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update the current user display name' })
    @ApiResponse({ status: 200, description: 'Profile updated.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async updateMe(@Req() req: RequestWithUser, @Body() dto: UpdateMeDto) {
        return this.authService.updateMe(req.user.sub, dto);
    }

    @Patch('avatar')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Set the current user hybrid avatar' })
    @ApiResponse({ status: 200, description: 'Avatar saved.' })
    async setAvatar(@Req() req: RequestWithUser, @Body() dto: AvatarDto) {
        return this.authService.setAvatar(req.user.sub, dto);
    }

    @Post('sign-up')
    @ApiOperation({
        summary: 'Create an account and send a Supabase verification email',
    })
    @ApiResponse({ status: 201, description: 'Verification email requested.' })
    async signUp(@Body() dto: SignUpDto) {
        return this.authService.signUp(dto);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Request a password reset email' })
    @ApiResponse({
        status: 200,
        description: 'Password reset email requested.',
    })
    async resetPassword(@Body() dto: ResetPasswordDto, @Res() res: Response) {
        const result = await this.authService.resetPassword(dto.email);
        return res.status(HttpStatus.OK).json(result);
    }

    @Post('check-email')
    @ApiOperation({ summary: 'Check if an email is already registered' })
    @ApiResponse({ status: 200, description: 'Email is available.' })
    @ApiResponse({ status: 409, description: 'Email already exists.' })
    async checkEmail(@Body() dto: ResetPasswordDto, @Res() res: Response) {
        const user = await this.authService.findByEmail(dto.email);
        if (user) {
            return res.status(HttpStatus.CONFLICT).json({
                message: 'An account with this email already exists.',
            });
        }
        return res.status(HttpStatus.OK).json({ message: 'Email available' });
    }

    @Post('validate-email')
    @ApiOperation({
        summary: 'Validate that an email domain can receive mail (MX records)',
    })
    @ApiResponse({
        status: 200,
        description: 'Validation result: { valid, reason? }.',
    })
    async validateEmail(@Body() dto: ResetPasswordDto, @Res() res: Response) {
        const result = await this.authService.validateEmailDomain(dto.email);
        return res.status(HttpStatus.OK).json(result);
    }
}
