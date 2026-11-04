import { Outlet } from '@tanstack/react-router';
import { Layout } from 'antd';

import { useAuth } from '@modules/auth';
import { useViewport } from '@shared/hooks/useViewport';

import { AppHeader } from './AppHeader';
import { AppShellProvider } from './AppShellProvider';
import { AppSidebar } from './AppSidebar';
import { MobileSidebar } from './MobileSidebar';
import { PageContent } from './PageContent';

const ApplicationShell = () => {
  const viewport = useViewport();
  const isMobile = viewport === 'mobile';

  return (
    <Layout hasSider={!isMobile} style={{ height: '100dvh', minHeight: '100vh' }}>
      {!isMobile ? <AppSidebar /> : null}
      <Layout style={{ minWidth: 0 }}>
        <AppHeader />
        <PageContent>
          <Outlet />
        </PageContent>
      </Layout>
      {isMobile ? <MobileSidebar /> : null}
    </Layout>
  );
};

export const ApplicationLayout = () => {
  const auth = useAuth();

  if (auth.status !== 'authenticated') {
    return null;
  }

  return (
    <AppShellProvider user={auth.user}>
      <ApplicationShell />
    </AppShellProvider>
  );
};
