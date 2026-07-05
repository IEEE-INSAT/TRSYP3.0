import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SyncUserDto } from "../dto/sync-user.dto";
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { ConfigService } from "@nestjs/config";
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient;
  constructor(private readonly prisma: PrismaService,
    private readonly configService: ConfigService
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

  async syncUser(supabaseId: string, dto: SyncUserDto) {
    // ── Secure Verification ──────────────────────────────────────────
    // Fetch the user from Supabase to authoritatively check if they have
    // verified their email. This prevents activating unverified users.
    const { data: supaUser, error: supaErr } = await this.supabase.auth.admin.getUserById(supabaseId);
    if (supaErr || !supaUser?.user) {
      this.logger.error(`Failed to fetch user from Supabase: ${supaErr?.message}`);
      throw new Error('Could not verify user in Supabase');
    }
    const emailConfirmed = !!supaUser.user.email_confirmed_at;

    this.logger.log(`syncUser called — supabaseId=${supabaseId}, email=${dto.email}, name=${dto.name}, lastName=${dto.lastName}, provider=${dto.provider}, emailConfirmed=${emailConfirmed}`);
    try {
      const user = await this.prisma.user.upsert({
        where: { supabaseId },
        update: {
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          provider: dto.provider ?? 'email',
          active: emailConfirmed,
        },
        create: {
          supabaseId,
          email: dto.email,
          name: dto.name,
          lastName: dto.lastName,
          provider: dto.provider ?? 'email',
          active: emailConfirmed,
        },
      });
      this.logger.log(`syncUser success — userId=${user.id}`);
      return user;
    } catch (error: any) {
      // P2002 = unique constraint violation.
      // The upsert searches by `supabaseId`. If the supabaseId is new but the
      // email already exists (e.g. user re-registered via a different provider),
      // adopt the existing row by updating it with the new supabaseId.
      // NOTE: we only check for P2002 (not meta.target) because the pg driver
      // adapter may not populate meta.target reliably.
      if (error?.code === 'P2002') {
        this.logger.warn(`Email ${dto.email} already exists — linking to new supabaseId=${supabaseId}`);
        const user = await this.prisma.user.update({
          where: { email: dto.email },
          data: {
            supabaseId,
            name: dto.name,
            lastName: dto.lastName,
            provider: dto.provider ?? 'email',
            active: emailConfirmed,
          },
        });
        this.logger.log(`syncUser (email fallback) success — userId=${user.id}`);
        return user;
      }
      this.logger.error(`syncUser failed for supabaseId=${supabaseId}`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }
  async findbySupabaseId(supabaseId: string) {
    return this.prisma.user.findUnique({
      where: { supabaseId },
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
      const redirectTo = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        this.logger.error(`resetPassword Supabase error for email=${email}: ${error.message}`);
        // Swallow the error — still return the generic message so the
        // response is indistinguishable from success.
      }
    }

    return { message: "If an account exists, a password reset email has been sent" };
  }
}