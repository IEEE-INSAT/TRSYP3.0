import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * JWT Authentication Guard
 * Validates JWT token from Authorization header
 * Note: This is a placeholder - integrate with your actual JWT validation
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    // TODO: Integrate with actual JWT verification service
    // For now, decode the token payload (replace with proper verification)
    try {
      const payload = this.decodeToken(token);
      // Attach user info to request for use in controllers
      (request as RequestWithUser).user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Decode JWT token payload
   * TODO: Replace with proper JWT verification using @nestjs/jwt
   */
  private decodeToken(token: string): JwtPayload {
    // Development bypass: allow "dev-token" for testing
    if (token === 'dev-token') {
      return {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      };
    }

    // Development bypass: allow "admin-token" for admin testing
    if (token === 'admin-token') {
      return {
        sub: 'test-admin-id',
        email: 'admin@example.com',
        role: 'admin',
      };
    }

    // Placeholder: decode base64 payload (middle part of JWT)
    // In production, use JwtService.verify() with secret
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    try {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8'),
      );
      return payload as JwtPayload;
    } catch {
      throw new Error('Failed to decode token payload');
    }
  }
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string; // User ID
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
