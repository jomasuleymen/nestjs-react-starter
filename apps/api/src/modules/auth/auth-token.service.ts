import { EnvConfigService } from '@infra/config/config.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_TOKEN_TYPE } from './auth.constants';
import { AuthenticatedUser, JwtAccessPayload, JwtRefreshPayload } from './auth.types';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: EnvConfigService,
  ) {}

  signAccessToken(user: AuthenticatedUser): Promise<string> {
    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      login: user.login,
      type: JWT_TOKEN_TYPE.Access,
    };

    return this.jwtService.signAsync(accessPayload, {
      secret: this.config.getJwtAccessSecret(),
      expiresIn: this.config.getJwtAccessTokenTtlSeconds(),
    });
  }

  signRefreshToken(userId: string, sessionId: string): Promise<string> {
    const refreshPayload: JwtRefreshPayload = {
      sub: userId,
      sid: sessionId,
      type: JWT_TOKEN_TYPE.Refresh,
    };

    return this.jwtService.signAsync(refreshPayload, {
      secret: this.config.getJwtRefreshSecret(),
      expiresIn: this.config.getJwtRefreshTokenTtlSeconds(),
    });
  }

  async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.config.getJwtAccessSecret(),
      });

      if (payload.type !== JWT_TOKEN_TYPE.Access) {
        throw new UnauthorizedException('Недействительный токен');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(token, {
        secret: this.config.getJwtRefreshSecret(),
      });

      if (payload.type !== JWT_TOKEN_TYPE.Refresh || !payload.sid) {
        throw new UnauthorizedException('Недействительный токен');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
  }
}
