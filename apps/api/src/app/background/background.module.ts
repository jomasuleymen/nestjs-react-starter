import { InfrastructureModule } from '@infra/infrastructure.module';
import { BullQueueModule } from '@infra/queue/bull-queue.module';
import { FileSchedulerModule } from '@modules/files/queue/file-scheduler.module';
import { FileWorkerModule } from '@modules/files/queue/file-worker.module';
import { DynamicModule, Module, Type } from '@nestjs/common';
import { BackgroundJob, BackgroundRole, BackgroundRuntimeConfig } from './background.config';

type BackgroundFeatureModule = Type<unknown>;

const BACKGROUND_MODULES: Record<
  BackgroundRole,
  Partial<Record<BackgroundJob, BackgroundFeatureModule>>
> = {
  [BackgroundRole.Worker]: {
    [BackgroundJob.Files]: FileWorkerModule,
  },
  [BackgroundRole.Scheduler]: {
    [BackgroundJob.Files]: FileSchedulerModule,
  },
};

@Module({})
export class BackgroundModule {
  static register(runtime: BackgroundRuntimeConfig): DynamicModule {
    return {
      module: BackgroundModule,
      imports: [
        InfrastructureModule,
        BullQueueModule,
        ...runtime.jobs.map((job) => {
          const feature = BACKGROUND_MODULES[runtime.role][job];
          if (!feature) {
            throw new Error(`Background job ${job} does not support role ${runtime.role}`);
          }

          return feature;
        }),
      ],
    };
  }
}
