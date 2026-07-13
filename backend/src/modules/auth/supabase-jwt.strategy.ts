import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { passportJwtSecret } from "jwks-rsa";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
    private readonly logger = new Logger(SupabaseJwtStrategy.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService
    ) {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        if (!supabaseUrl) {
            throw new Error('SUPABASE_URL is not defined in environment variables');
        }

        super({
            jwtFromRequest: (req: any) => {
                const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
                if (token) {
                    this.logger.debug('Extracted Token');
                    // Note: We bypass manual jwt.verify() because jwks-rsa handles asynchronous secret fetching natively via passport-jwt.
                    // If it throws a 401, Nest's built-in AuthGuard intercepts it.
                } else {
                    this.logger.warn(`No Bearer token found in request headers`);
                }
                return token;
            },
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
            }),
            algorithms: ['ES256'],
        });
    }

    async validate(payload: any) {
        // Preserve the original Supabase UUID so controllers can always access it.
        const supabaseId = payload.sub;

        // Look up the actual database user using the Supabase ID (sub).
        let user = await this.prisma.user.findUnique({
            where: { supabaseId }
        });

        // Provisioning normally happens via the `on_auth_user_created` DB trigger
        // inside the signup transaction, so the row already exists here. This
        // lazy upsert is a self-healing safety net for the rare case where the
        // trigger is missing/disabled or the auth.users row was created out of
        // band — so a user with a valid token is never locked out.
        if (!user) {
            this.logger.warn(`No DB user for supabaseId=${supabaseId}; provisioning lazily`);
            const { name, lastName } = this.resolveName(payload);
            user = await this.prisma.user.upsert({
                where: { supabaseId },
                update: {},
                create: {
                    email: payload.email,
                    name,
                    lastName,
                    supabaseId,
                    provider: payload.app_metadata?.provider ?? 'email',
                    // They hold a cryptographically valid, unexpired Supabase
                    // token, so treat them as active on this recovery path.
                    active: true,
                },
            });
        }

        if (!user.active) {
            throw new UnauthorizedException(
                'Verify your email address before accessing TRSYP 3.0.',
            );
        }

        // Replace the Supabase ID with the real internal database ID.
        // This means @CurrentUser('sub') will now correctly return the DB ID across the entire app.
        return { ...payload, sub: user.id, _supabaseId: supabaseId };
    }

    /**
     * Split a first/last name out of the Supabase JWT, mirroring the DB trigger.
     * Email signups carry an explicit `name` + `lastName`; OAuth providers put
     * the FULL name in `name`, so we prefer OIDC `given_name` / `family_name`
     * (falling back to splitting `full_name`) to avoid the full name leaking
     * into the first-name field.
     */
    private resolveName(payload: any): { name: string; lastName: string } {
        const meta = payload.user_metadata ?? {};
        const provider = payload.app_metadata?.provider ?? 'email';

        if (provider === 'email') {
            return { name: meta.name || 'Participant', lastName: meta.lastName || '' };
        }

        const fullName: string = (meta.full_name || meta.name || '').trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        return {
            name: meta.given_name || parts[0] || 'Participant',
            lastName: meta.family_name || parts.slice(1).join(' ') || '',
        };
    }
}
