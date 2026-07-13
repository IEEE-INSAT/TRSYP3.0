import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { ConfigService } from "@nestjs/config";
import { resolveMx } from "dns/promises";
import { EmailService } from '../../email/service';

// Reserved / documentation domains that can never receive email (RFC 2606).
const RESERVED_DOMAINS = ['example.com', 'example.net', 'example.org', 'test.com', 'test.net', 'test.org', 'localhost', 'invalid'];
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;
  constructor(private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
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
  async resetPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Only send the reset email if the user actually exists.
    // We intentionally do NOT throw or return a different response when the
    // user is missing — doing so would let an attacker enumerate registered
    // emails by comparing HTTP status codes (200 vs 500).
    if (user) {
      try {
        const redirectTo = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
        const { data, error } = await this.supabase.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { redirectTo },
        });
        const resetUrl = data.properties?.action_link;

        if (error || !resetUrl) {
          throw new Error(error?.message ?? 'Supabase did not return a password reset link');
        }

        await this.emailService.sendPasswordResetEmail(email, resetUrl);
      } catch (error) {
        this.logger.error(
          `Unable to send password reset email: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Keep the same generic response so a failed delivery cannot be used
        // to enumerate accounts.
      }
    }

    return { message: "If an account exists, a password reset email has been sent" };
  }

  /**
   * Verify the domain part of an email can actually receive mail by checking
   * for MX records. This lives on the backend (not the frontend) because the
   * frontend is a static export with no Node runtime to do DNS lookups.
   *
   * Always resolves (never throws) so the caller can treat it as advisory and
   * never hard-block signup on a transient DNS hiccup.
   */
  async validateEmailDomain(email: string): Promise<{ valid: boolean; reason?: string }> {
    const parts = email.split('@');
    if (parts.length !== 2 || !parts[1]) {
      return { valid: false, reason: 'Invalid email format.' };
    }

    const domain = parts[1].toLowerCase();

    if (RESERVED_DOMAINS.includes(domain)) {
      return { valid: false, reason: `"${domain}" is a reserved domain and cannot receive email.` };
    }

    try {
      const mxRecords = await resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return { valid: false, reason: `"${domain}" does not have any mail servers.` };
      }
      return { valid: true };
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : undefined;
      if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ESERVFAIL') {
        return { valid: false, reason: 'This email domain does not exist.' };
      }
      // Unknown/transient DNS error — don't block the user.
      this.logger.warn(`validateEmailDomain DNS error for ${domain}: ${String(err)}`);
      return { valid: true };
    }
  }
}
