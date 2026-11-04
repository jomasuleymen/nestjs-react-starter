import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenService } from './auth-token.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticationGuard } from './guards/authentication.guard';
import { RolesGuard } from './guards/roles.guard';
import { PasswordService } from './password.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSessionService,
    AuthTokenService,
    PasswordService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [PasswordService],
})
export class AuthModule {}
