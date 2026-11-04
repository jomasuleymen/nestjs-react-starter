import { bootstrapBackgroundApplication, handleBootstrapError } from '@app/application.bootstrap';
import { parseBackgroundRuntimeConfig } from '@app/background/background.config';
import { BackgroundModule } from '@app/background/background.module';

const runtime = parseBackgroundRuntimeConfig();
const name = `Background ${runtime.role} (${runtime.jobs.join(', ')})`;

void bootstrapBackgroundApplication(BackgroundModule.register(runtime), name).catch(
  handleBootstrapError,
);
