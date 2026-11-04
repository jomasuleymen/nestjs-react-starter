import { EnvConfigService } from '@infra/config/config.service';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EnvConfigModule } from '../config/config.module';
import { BullQueueDefaultJobsOptions } from './bull-queue.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [EnvConfigModule],
      useFactory: (envConfigService: EnvConfigService) => ({
        connection: {
          host: envConfigService.getRedisHost(),
          port: envConfigService.getRedisPort(),
          password: envConfigService.getRedisPassword(),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryDelayOnFailover: 200,
          retryStrategy: (times: number) => Math.min(times * 200, 5000),
        },
        defaultJobOptions: BullQueueDefaultJobsOptions,
      }),
      inject: [EnvConfigService],
    }),
  ],
  exports: [BullModule],
})
export class BullQueueModule {}
