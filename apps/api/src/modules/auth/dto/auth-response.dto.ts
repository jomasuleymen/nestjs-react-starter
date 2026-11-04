import { UserRole } from '@generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import type { AuthenticatedUser, AuthSessionResult, TokenPair } from '../auth.types';

export class AuthUserDto {
  id: string;
  login: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role: UserRole;

  static from(user: AuthenticatedUser): AuthUserDto {
    return plainToInstance(AuthUserDto, user);
  }
}

export class AuthResponseDto {
  accessToken: string;
  user: AuthUserDto;

  static from(auth: AuthSessionResult): AuthResponseDto {
    return plainToInstance(AuthResponseDto, {
      accessToken: auth.accessToken,
      user: AuthUserDto.from(auth.user),
    } satisfies AuthResponseDto);
  }
}

export class RefreshResponseDto {
  accessToken: string;

  static from(tokenPair: TokenPair): RefreshResponseDto {
    return plainToInstance(RefreshResponseDto, tokenPair satisfies RefreshResponseDto);
  }
}
