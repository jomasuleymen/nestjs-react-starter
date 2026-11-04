import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: process.env.OPENAPI_INPUT ?? 'http://localhost:3000/swagger/yaml',
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
