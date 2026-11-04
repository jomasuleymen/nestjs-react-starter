import { UserRole, UserStatus, type User } from '@generated/prisma/client';
import { PrismaService } from '@infra/database/prisma.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenService } from './auth-token.service';
import { AuthenticatedUser, AuthSessionResult, SessionMetadata, TokenPair } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';

type UserPublicRecord = Pick<User, 'id' | 'login' | 'role' | 'status'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly authSessionService: AuthSessionService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async login(dto: LoginDto, sessionMetadata: SessionMetadata): Promise<AuthSessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { login: this.normalizeLogin(dto.login) },
      select: {
        id: true,
        login: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const authUser = this.toAuthenticatedUser(user);
    const session = await this.authSessionService.createSession({
      userId: authUser.id,
      metadata: sessionMetadata,
    });
    const [accessToken, refreshToken] = await Promise.all([
      this.authTokenService.signAccessToken(authUser),
      this.authTokenService.signRefreshToken(authUser.id, session.id),
    ]);

    return {
      accessToken,
      refreshToken,
      user: authUser,
    };
  }

  async refresh(
    refreshToken: string | undefined,
    sessionMetadata: SessionMetadata,
  ): Promise<TokenPair> {
    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const refreshPayload = await this.authTokenService.verifyRefreshToken(refreshToken);
    const user = await this.authSessionService.refreshSession({
      sessionId: refreshPayload.sid,
      userId: refreshPayload.sub,
      metadata: sessionMetadata,
    });

    if (!user) {
      throw new UnauthorizedException('Недействительный токен');
    }

    const [accessToken, nextRefreshToken] = await Promise.all([
      this.authTokenService.signAccessToken(user),
      this.authTokenService.signRefreshToken(user.id, refreshPayload.sid),
    ]);

    return {
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async getCurrentUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.getActiveUserById(userId);

    return this.toAuthenticatedUser(user);
  }

  async validateAccessToken(token: string): Promise<AuthenticatedUser> {
    const payload = await this.authTokenService.verifyAccessToken(token);
    const user = await this.getActiveUserById(payload.sub);

    return this.toAuthenticatedUser(user);
  }

  private async getActiveUserById(userId: string): Promise<UserPublicRecord> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Пользователь не активен');
    }

    return user;
  }

  private toAuthenticatedUser(user: {
    id: string;
    login: string;
    role: UserRole;
  }): AuthenticatedUser {
    return {
      id: user.id,
      login: user.login,
      role: user.role,
    };
  }

  private normalizeLogin(login: string): string {
    return login.trim().toLowerCase();
  }
}
