import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Tooltip } from 'antd';

import { appLayoutConfig } from './appLayoutConfig';
import { AppNavigationPanel } from './AppNavigationPanel';
import { useAppShell } from './useAppShell';

export const MobileSidebar = () => {
  const { closeMobileSidebar, mobileSidebarOpen } = useAppShell();

  return (
    <Drawer
      closable={false}
      destroyOnHidden
      open={mobileSidebarOpen}
      placement="left"
      size={appLayoutConfig.mobileDrawerWidth}
      styles={{ body: { padding: 0 } }}
      onClose={closeMobileSidebar}
    >
      <AppNavigationPanel
        extra={
          <Tooltip title="Закрыть навигацию">
            <Button
              aria-label="Закрыть навигацию"
              icon={<CloseOutlined />}
              type="text"
              onClick={closeMobileSidebar}
            />
          </Tooltip>
        }
      />
    </Drawer>
  );
};
