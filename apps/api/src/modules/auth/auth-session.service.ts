import StringUtils from '@common/utils/string.utils';
import { UserRole, UserStatus } from '@generated/prisma/client';
import { PrismaService } from '@infra/database/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  AuthenticatedUser,
  AuthSessionRecord,
  CreateSessionInput,
  RefreshSessionInput,
  SessionMetadata,
} from './auth.types';

@Injectable()
export class AuthSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(input: CreateSessionInput): Promise<AuthSessionRecord> {
    return this.prisma.session.create({
      data: {
        userId: input.userId,
        userAgent: StringUtils.truncate(input.metadata.userAgent, 512),
        ipAddress: StringUtils.truncate(input.metadata.ipAddress, 45),
        lastSeenAt: new Date(),
      },
      select: {
        id: true,
      },
    });
  }

  async refreshSession(input: RefreshSessionInput): Promise<AuthenticatedUser | undefined> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: input.sessionId,
        userId: input.userId,
      },
      select: {
        user: {
          select: {
            id: true,
            login: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!session || session.user.status !== UserStatus.ACTIVE) {
      return undefined;
    }

    await this.prisma.session.update({
      where: { id: input.sessionId },
      data: this.toSessionTrackingUpdate(input.metadata, new Date()),
    });

    return this.toAuthenticatedUser(session.user);
  }

  private toSessionTrackingUpdate(metadata: SessionMetadata, lastSeenAt: Date) {
    return {
      lastSeenAt,
      userAgent: StringUtils.truncate(metadata.userAgent, 512),
      ipAddress: StringUtils.truncate(metadata.ipAddress, 45),
    };
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
}
