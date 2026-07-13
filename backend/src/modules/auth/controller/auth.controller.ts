import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    Res,
    HttpStatus,
    Get,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import { Response, Request } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ResetPasswordDto, SignUpDto } from '../dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

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
    async getMe(@Req() req: Request, @Res() res: Response) {
        const user = await this.authService.findbySupabaseId(
            (req.user as any)._supabaseId,
        );
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return res.status(HttpStatus.OK).json(user);
    }

    @Post('sign-up')
    @ApiOperation({
        summary: 'Create an account and send a TRSYP email verification link',
    })
    @ApiResponse({ status: 201, description: 'Verification email sent.' })
    @ApiResponse({
        status: 409,
        description: 'An account with this email already exists.',
    })
    async signUp(@Body() dto: SignUpDto) {
        return this.authService.signUp(dto);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Request a password reset email' })
    @ApiResponse({ status: 200, description: 'Password reset email sent.' })
    async Password_reset(@Body() dto: ResetPasswordDto, @Res() res: Response) {
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
            return res
                .status(HttpStatus.CONFLICT)
                .json({
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
