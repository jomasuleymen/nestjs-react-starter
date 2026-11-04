import { AppBrand } from './AppBrand';
import { AppNavigationMenu } from './AppNavigationMenu';

import type { ReactNode } from 'react';

interface AppNavigationPanelProps {
  collapsed?: boolean;
  extra?: ReactNode;
}

export const AppNavigationPanel = ({ collapsed = false, extra }: AppNavigationPanelProps) => (
  <div style={{ display: 'flex', height: '100%', flexDirection: 'column', minHeight: 0 }}>
    <AppBrand collapsed={collapsed} extra={extra} />
    <div style={{ flex: 1, minHeight: 0 }}>
      <AppNavigationMenu collapsed={collapsed} />
    </div>
  </div>
);
