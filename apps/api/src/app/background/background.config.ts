export const BackgroundRole = {
  Worker: 'worker',
  Scheduler: 'scheduler',
} as const;

export type BackgroundRole = (typeof BackgroundRole)[keyof typeof BackgroundRole];

export const BackgroundJob = {
  Files: 'files',
} as const;

export type BackgroundJob = (typeof BackgroundJob)[keyof typeof BackgroundJob];

export interface BackgroundRuntimeConfig {
  role: BackgroundRole;
  jobs: BackgroundJob[];
}

const BACKGROUND_ROLES = new Set<BackgroundRole>(Object.values(BackgroundRole));
const BACKGROUND_JOBS = new Set<BackgroundJob>(Object.values(BackgroundJob));

const SUPPORTED_JOBS: Record<BackgroundRole, readonly BackgroundJob[]> = {
  [BackgroundRole.Worker]: [BackgroundJob.Files],
  [BackgroundRole.Scheduler]: [BackgroundJob.Files],
};

const parseJobs = (role: BackgroundRole, value?: string): BackgroundJob[] => {
  if (!value?.trim()) {
    return [...SUPPORTED_JOBS[role]];
  }

  const jobs = [
    ...new Set(
      value
        .split(/[\s,]+/)
        .map((job) => job.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const unknownJobs = jobs.filter((job) => !BACKGROUND_JOBS.has(job as BackgroundJob));

  if (unknownJobs.length > 0) {
    throw new Error(`BACKGROUND_JOBS contains unknown jobs: ${unknownJobs.join(', ')}`);
  }
  const unsupportedJobs = jobs.filter(
    (job) => !SUPPORTED_JOBS[role].includes(job as BackgroundJob),
  );
  if (unsupportedJobs.length > 0) {
    throw new Error(
      `BACKGROUND_JOBS contains jobs unsupported for ${role}: ${unsupportedJobs.join(', ')}`,
    );
  }

  return jobs as BackgroundJob[];
};

export const parseBackgroundRuntimeConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): BackgroundRuntimeConfig => {
  const role = environment['BACKGROUND_ROLE']?.trim().toLowerCase();

  if (!role || !BACKGROUND_ROLES.has(role as BackgroundRole)) {
    throw new Error('BACKGROUND_ROLE must be one of: worker, scheduler');
  }

  return {
    role: role as BackgroundRole,
    jobs: parseJobs(role as BackgroundRole, environment['BACKGROUND_JOBS']),
  };
};
