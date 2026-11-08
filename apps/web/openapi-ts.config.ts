import { defineConfig } from '@hey-api/openapi-ts';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  input:
    process.env.OPENAPI_INPUT ??
    fileURLToPath(new URL('../api/.generated/openapi.json', import.meta.url)),
  output: {
    clean: true,
    path: 'src/api/generated',
    postProcess: ['prettier'],
  },
  plugins: [
    {
      name: '@hey-api/typescript',
      enums: 'typescript',
    },
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: './src/api/http/generated-client-config.ts',
    },
    '@hey-api/sdk',
    {
      name: '@tanstack/react-query',
      includeInEntry: true,
      mutationOptions: true,
      queryKeys: true,
      queryOptions: true,
    },
  ],
});
