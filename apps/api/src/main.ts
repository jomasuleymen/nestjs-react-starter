import { ApiModule } from '@app/api/api.module';
import { bootstrapHttpApplication, handleBootstrapError } from '@app/application.bootstrap';

void bootstrapHttpApplication(ApiModule).catch(handleBootstrapError);
