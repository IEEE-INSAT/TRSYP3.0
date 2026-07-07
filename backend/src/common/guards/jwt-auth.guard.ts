import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Delegates to SupabaseJwtStrategy which:
 * 1. Verifies the token cryptographically via JWKS
 * 2. Looks up the database User by supabaseId
 * 3. Replaces payload.sub with the internal DB user ID
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('supabase-jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    
    // The SupabaseJwtStrategy always resolves (or lazily provisions) a DB user,
    // so a successful validation guarantees a synced profile here.
    return user;
  }
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
    sub: string; // Internal database User ID (resolved from Supabase ID by the strategy)
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

/**
 * Request with authenticated user
 */
export interface RequestWithUser extends Request {
    user: JwtPayload;
}
    