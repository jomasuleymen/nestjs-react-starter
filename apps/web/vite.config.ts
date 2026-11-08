import { fileURLToPath, URL } from 'node:url';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { compression } from 'vite-plugin-compression2';

const appRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command, isPreview, mode }) => {
  const isDev = command === 'serve' && !isPreview;
  const isProd = command === 'build';

  const env = loadEnv(mode, appRoot, 'VITE_');

  const proxy = {
    '/api': {
      target: env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000',
      changeOrigin: true,
    },
  };

  return {
    root: appRoot,
    envDir: appRoot,

    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts',
      }),

      react(),

      isProd &&
        compression({
          threshold: 1024,
          algorithms: ['brotliCompress', 'gzip'],
        }),
    ],

    resolve: {
      dedupe: ['react', 'react-dom'],
      tsconfigPaths: true,
    },

    build: {
      target: 'baseline-widely-available',

      // Prefer 'hidden' when source maps are uploaded
      // to Sentry or another error-monitoring service.
      sourcemap: false,

      // Compression plugin already does actual compression.
      reportCompressedSize: false,

      license: true,

      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              },
              {
                name: 'antd',
                test: /node_modules[\\/](?:antd|@ant-design)[\\/]/,
              },
            ],
          },
        },
      },
    },

    server: isDev
      ? {
          port: 5173,
          strictPort: true,
          proxy,

          warmup: {
            clientFiles: [
              './src/main.tsx',
              './src/app/App.tsx',
              './src/app/router.ts',
              './src/routes/__root.tsx',
            ],
          },
        }
      : undefined,

    preview: isPreview
      ? {
          port: 4173,
          strictPort: true,
          proxy,
        }
      : undefined,
  };
});
