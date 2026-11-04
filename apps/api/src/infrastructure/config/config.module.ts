import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvConfigService } from './config.service';
import { validate } from './config.validation';
import { loadEnvironment } from './environment.loader';

loadEnvironment();

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      ignoreEnvFile: true,
      validate,
    }),
  ],
  providers: [EnvConfigService],
  exports: [EnvConfigService, ConfigModule],
})
export class EnvConfigModule {}
