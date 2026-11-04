import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { EnvConfigModule } from '../config/config.module';
import { EnvConfigService } from '../config/config.service';
import { pinoConfig } from './pino.logger';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [EnvConfigModule],
      useFactory: (envConfigService: EnvConfigService) => pinoConfig(envConfigService),
      inject: [EnvConfigService],
    }),
  ],

  exports: [PinoLoggerModule],
})
export class LoggerModule {}
