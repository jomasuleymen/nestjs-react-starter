import { Layout, theme } from 'antd';

import { useThemeStore } from '@shared/theme/themeStore';

import { appLayoutConfig } from './appLayoutConfig';
import { AppNavigationPanel } from './AppNavigationPanel';
import { useAppShell } from './useAppShell';

export const AppSidebar = () => {
  const { token } = theme.useToken();
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const { sidebarCollapsed } = useAppShell();

  return (
    <Layout.Sider
      collapsed={sidebarCollapsed}
      collapsedWidth={appLayoutConfig.collapsedSidebarWidth}
      style={{
        borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        height: '100dvh',
        overflow: 'hidden',
      }}
      theme={colorScheme}
      trigger={null}
      width={appLayoutConfig.sidebarWidth}
    >
      <AppNavigationPanel collapsed={sidebarCollapsed} />
    </Layout.Sider>
  );
};
