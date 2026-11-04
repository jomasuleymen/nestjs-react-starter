import { config } from 'dotenv';
import { EnvEnvironment } from './config.constants';

const ENV_FILE_PATHS = ['.env.local', '.env'];

let isEnvironmentLoaded = false;

export const loadEnvironment = (): void => {
  if (isEnvironmentLoaded) {
    return;
  }

  config({
    path: ENV_FILE_PATHS,
    override: false,
    quiet: true,
  });
  isEnvironmentLoaded = true;
};

export const isProductionEnvironment = (): boolean => {
  loadEnvironment();

  return process.env['NODE_ENV'] === EnvEnvironment.Production;
};
