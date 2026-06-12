import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { passportJwtSecret } from "jwks-rsa";
import * as jwt from "jsonwebtoken";

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
    private readonly logger = new Logger(SupabaseJwtStrategy.name);

    constructor(private readonly configService: ConfigService) {
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
        return payload;
    }
}