import {
    ConflictException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { resolveMx } from 'dns/promises';
import { SignUpDto } from '../dto';

// Reserved / documentation domains that can never receive email (RFC 2606).
const RESERVED_DOMAINS = [
    'example.com',
    'example.net',
    'example.org',
    'test.com',
    'test.net',
    'test.org',
    'localhost',
    'invalid',
];
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private supabase: SupabaseClient;
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>(
            'SUPABASE_SERVICE_ROLE_KEY',
        );
        if (!supabaseUrl || !supabaseKey) {
            throw new Error(
                'Supabase credentials not found in environment variables',
            );
        }
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }

    async findbySupabaseId(supabaseId: string) {
        return this.prisma.user.findUnique({
            where: { supabaseId },
        });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Compatibility for the already-deployed static frontend. New frontend
     * builds call Supabase from the browser, but this endpoint must remain
     * available until every hostname has received that build.
     */
    async signUp(dto: SignUpDto): Promise<{ message: string }> {
        const { data, error } = await this.supabase.auth.signUp({
            email: dto.email,
            password: dto.password,
            options: {
                data: { name: dto.name, lastName: dto.lastName },
                emailRedirectTo: this.getFrontendUrl('/verify-email/'),
            },
        });

        if (error || !data.user) {
            if (
                error?.code === 'email_exists' ||
                error?.code === 'user_already_exists' ||
                /already (been )?(registered|exists)/i.test(
                    error?.message ?? '',
                )
            ) {
                throw new ConflictException(
                    'An account with this email already exists. Please sign in instead.',
                );
            }

            this.logger.error(
                `Unable to start Supabase email signup: ${error?.message ?? 'No user returned'}`,
            );
            throw new ServiceUnavailableException(
                'We could not send the verification email. Please try again shortly.',
            );
        }

        // With email confirmation enabled, Supabase intentionally returns an
        // obfuscated user for an address that already exists. That includes an
        // account whose original confirmation email was missed. Ask Supabase
        // to resend the *signup* email in that case; new users already receive
        // one from signUp, so sending again would only hit the rate limit.
        if (data.user.identities?.length === 0) {
            const { error: resendError } = await this.supabase.auth.resend({
                type: 'signup',
                email: dto.email,
                options: {
                    emailRedirectTo: this.getFrontendUrl('/verify-email/'),
                },
            });
            if (resendError) {
                this.logger.error(
                    `Unable to resend Supabase signup email: ${resendError.message}`,
                );
                throw new ServiceUnavailableException(
                    'We could not send the verification email. Please try again shortly.',
                );
            }
        }

        return {
            message: 'Check your inbox to verify your TRSYP 3.0 account.',
        };
    }

    /** Compatibility for deployed clients that still use the backend reset API. */
    async resetPassword(email: string): Promise<{ message: string }> {
        const user = await this.findByEmail(email);
        if (user) {
            try {
                const { error } =
                    await this.supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: this.getFrontendUrl('/reset-password/'),
                    });
                if (error) throw new Error(error.message);
            } catch (error) {
                this.logger.error(
                    `Unable to start Supabase password recovery: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                );
            }
        }

        return {
            message:
                'If an account exists, a password reset email has been sent',
        };
    }

    private getFrontendUrl(path: string): string {
        const frontendUrl =
            this.configService.get<string>('FRONTEND_URL') ??
            'https://rtc.ieee.tn';
        return new URL(path, frontendUrl).toString();
    }

    /**
     * Verify the domain part of an email can actually receive mail by checking
     * for MX records. This lives on the backend (not the frontend) because the
     * frontend is a static export with no Node runtime to do DNS lookups.
     *
     * Always resolves (never throws) so the caller can treat it as advisory and
     * never hard-block signup on a transient DNS hiccup.
     */
    async validateEmailDomain(
        email: string,
    ): Promise<{ valid: boolean; reason?: string }> {
        const parts = email.split('@');
        if (parts.length !== 2 || !parts[1]) {
            return { valid: false, reason: 'Invalid email format.' };
        }

        const domain = parts[1].toLowerCase();

        if (RESERVED_DOMAINS.includes(domain)) {
            return {
                valid: false,
                reason: `"${domain}" is a reserved domain and cannot receive email.`,
            };
        }

        try {
            const mxRecords = await resolveMx(domain);
            if (!mxRecords || mxRecords.length === 0) {
                return {
                    valid: false,
                    reason: `"${domain}" does not have any mail servers.`,
                };
            }
            return { valid: true };
        } catch (err: unknown) {
            const code =
                err && typeof err === 'object' && 'code' in err
                    ? (err as { code: string }).code
                    : undefined;
            if (
                code === 'ENOTFOUND' ||
                code === 'ENODATA' ||
                code === 'ESERVFAIL'
            ) {
                return {
                    valid: false,
                    reason: 'This email domain does not exist.',
                };
            }
            // Unknown/transient DNS error — don't block the user.
            this.logger.warn(
                `validateEmailDomain DNS error for ${domain}: ${String(err)}`,
            );
            return { valid: true };
        }
    }
}
