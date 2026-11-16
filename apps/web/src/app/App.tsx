import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Alert, App as AntApp, Button, ConfigProvider } from 'antd';
import ru_RU from 'antd/locale/ru_RU';
import { useEffect } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { useThemeStore } from '@shared/theme/themeStore';

import { queryClient } from './queryClient';
import { router } from './router';
import { appThemes } from './theme';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <main
    style={{
      display: 'grid',
      minHeight: '100vh',
      padding: 24,
      placeItems: 'center',
    }}
  >
    <Alert
      action={<Button onClick={resetErrorBoundary}>Повторить</Button>}
      description={error instanceof Error ? error.message : undefined}
      showIcon
      title="Приложение не смогло продолжить работу"
      type="error"
    />
  </main>
);

export const App: React.FC = () => {
  const colorScheme = useThemeStore((state) => state.colorScheme);

  useEffect(() => {
    document.documentElement.style.colorScheme = colorScheme;
  }, [colorScheme]);

  return (
    <ConfigProvider theme={appThemes[colorScheme]} locale={ru_RU}>
      <AntApp>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  );
};
