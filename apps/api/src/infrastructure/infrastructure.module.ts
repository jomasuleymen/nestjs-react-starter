import { Global, Module } from '@nestjs/common';
import { EnvConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { LoggerModule } from './logging/logger.module';

@Global()
@Module({
  imports: [EnvConfigModule, LoggerModule, PrismaModule],
  exports: [EnvConfigModule, LoggerModule, PrismaModule],
})
export class InfrastructureModule {}
