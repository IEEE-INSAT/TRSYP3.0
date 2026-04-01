import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser, JwtPayload } from '../guards/jwt-auth.guard';

/**
 * Extract current user from request
 * Usage: @CurrentUser() user: JwtPayload
 * Usage: @CurrentUser('sub') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
