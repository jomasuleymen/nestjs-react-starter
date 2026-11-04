import { EnvEnvironment } from '@infra/config/config.constants';
import { EnvConfigService } from '@infra/config/config.service';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AUTH_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { AuthenticatedUser, SessionMetadata } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto, AuthUserDto, RefreshResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: EnvConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const authResponse = await this.authService.login(dto, this.getSessionMetadata(request));
    this.setRefreshCookie(response, authResponse.refreshToken);

    return AuthResponseDto.from(authResponse);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RefreshResponseDto> {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const tokenPair = await this.authService.refresh(
      refreshToken,
      this.getSessionMetadata(request),
    );
    this.setRefreshCookie(response, tokenPair.refreshToken);

    return RefreshResponseDto.from(tokenPair);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    this.clearRefreshCookie(response);
  }

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    const currentUser = await this.authService.getCurrentUser(user.id);

    return AuthUserDto.from(currentUser);
  }

  private getRefreshTokenFromCookie(request: Request): string | undefined {
    const cookies: unknown = request.cookies;

    if (typeof cookies !== 'object' || cookies === null) {
      return undefined;
    }

    const refreshToken = (cookies as Record<string, unknown>)[AUTH_COOKIE.RefreshToken];

    return typeof refreshToken === 'string' ? refreshToken : undefined;
  }

  private getSessionMetadata(request: Request): SessionMetadata {
    return {
      userAgent: request.header('user-agent'),
      ipAddress: request.ip,
    };
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(AUTH_COOKIE.RefreshToken, refreshToken, {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'lax',
      path: AUTH_COOKIE.Path,
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(AUTH_COOKIE.RefreshToken, {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'lax',
      path: AUTH_COOKIE.Path,
    });
  }

  private isProduction(): boolean {
    return this.config.getNodeEnv() === EnvEnvironment.Production;
  }
}
