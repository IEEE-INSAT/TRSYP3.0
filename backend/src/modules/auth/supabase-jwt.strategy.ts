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
                    this.logger.debug(`Extracted Token: ${token.substring(0, 20)}...`);
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
        // Look up the actual database user using the Supabase ID (sub)
        const user = await this.prisma.user.findUnique({
            where: { supabaseId: payload.sub }
        });

        if (!user) {
            throw new UnauthorizedException('User not found in database');
        }

        // Replace the Supabase ID with the real internal database ID.
        // This means @CurrentUser('sub') will now correctly return the DB ID across the entire app.
        return { ...payload, sub: user.id };
    }
}