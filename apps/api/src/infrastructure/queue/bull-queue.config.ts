import { JobsOptions } from 'bullmq';
import ms from 'ms';

export const BullQueueRemoveOnComplete = {
  age: ms('1d') / ms('1s'),
  count: 1_000,
} as const;

export const BullQueueRemoveOnFail = {
  age: ms('7d') / ms('1s'),
  count: 5_000,
} as const;

export const BullQueueDefaultJobsOptions: JobsOptions = {
  removeOnComplete: BullQueueRemoveOnComplete,
  removeOnFail: BullQueueRemoveOnFail,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: ms('2s'),
  },
};
