import { PrismaClient } from '@generated/prisma/client';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { EnvConfigService } from '../config/config.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: EnvConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.getDatabaseUrl(),
    });

    super({
      adapter,
      log: config.getDatabaseLogging() ? ['query', 'error', 'warn'] : ['error', 'warn'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
