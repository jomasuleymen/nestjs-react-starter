import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, theme, Tooltip, Typography, type MenuProps } from 'antd';

import { roleLabels } from '@modules/auth';
import { useViewport } from '@shared/hooks/useViewport';
import { ColorSchemeSwitch } from '@shared/theme/ColorSchemeSwitch';

import { appLayoutConfig } from './appLayoutConfig';
import { useAppShell } from './useAppShell';

export const AppHeader = () => {
  const { token } = theme.useToken();
  const viewport = useViewport();
  const { logout, sidebarCollapsed, toggleSidebar, user } = useAppShell();
  const isMobile = viewport === 'mobile';
  const userMenu: MenuProps = {
    items: [{ icon: <LogoutOutlined />, key: 'logout', label: 'Выйти' }],
    onClick: ({ key }) => {
      if (key === 'logout') {
        void logout();
      }
    },
  };
  const notificationMenu: MenuProps = {
    items: [{ disabled: true, key: 'empty', label: 'Нет новых уведомлений' }],
  };
  const menuIcon = sidebarCollapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />;
  const navigationLabel = isMobile
    ? 'Открыть навигацию'
    : sidebarCollapsed
      ? 'Развернуть навигацию'
      : 'Свернуть навигацию';

  return (
    <Layout.Header
      style={{
        display: 'flex',
        height: appLayoutConfig.headerHeight,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: token.padding,
        borderBlockEnd: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        gap: token.margin,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={navigationLabel}>
          <Button
            aria-label={navigationLabel}
            icon={menuIcon}
            size="large"
            type="text"
            onClick={toggleSidebar}
          />
        </Tooltip>
      </div>
      <div
        style={{
          display: 'flex',
          flex: '0 0 auto',
          alignItems: 'center',
          gap: token.marginXS,
        }}
      >
        <ColorSchemeSwitch />
        <Tooltip title="Уведомления">
          <Dropdown menu={notificationMenu} placement="bottomRight" trigger={['click']}>
            <Button
              aria-label="Уведомления"
              icon={<NotificationOutlined />}
              size="large"
              type="text"
            />
          </Dropdown>
        </Tooltip>
        <Tooltip title="Профиль">
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <Button
              aria-label="Открыть меню профиля"
              style={{
                display: 'flex',
                height: 40,
                alignItems: 'center',
                paddingInline: token.paddingXS,
              }}
              type="text"
            >
              <Avatar>{user.login.slice(0, 1).toUpperCase()}</Avatar>
              {!isMobile ? (
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    lineHeight: 1.3,
                  }}
                >
                  <Typography.Text strong>{user.login}</Typography.Text>
                  <Typography.Text type="secondary">{roleLabels[user.role]}</Typography.Text>
                </span>
              ) : null}
            </Button>
          </Dropdown>
        </Tooltip>
      </div>
    </Layout.Header>
  );
};
