import { JobsOptions } from 'bullmq';

export type BullJobPayloadMap = Record<string, object>;

export type BullJobName<TJobs extends BullJobPayloadMap> = Extract<keyof TJobs, string>;

export type BullJobOptions = JobsOptions;
