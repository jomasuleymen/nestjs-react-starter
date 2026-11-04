import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { AuthenticatedRequest } from '../auth.types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException();
    }

    request.user = await this.authService.validateAccessToken(token);

    return true;
  }

  private extractBearerToken(authorization: string | undefined): string | undefined {
    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.trim().split(/\s+/);

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
