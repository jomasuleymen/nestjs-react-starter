import { Link } from '@tanstack/react-router';
import { Menu, theme, Tooltip, type MenuProps } from 'antd';
import { useMemo } from 'react';

import { useViewport } from '@shared/hooks/useViewport';
import { useThemeStore } from '@shared/theme/themeStore';

import type { AppNavigationGroup } from '../appNavigation';

import { useAppShell } from './useAppShell';

interface AppNavigationMenuProps {
  collapsed?: boolean;
}

const toMenuItems = (
  navigation: readonly AppNavigationGroup[],
  collapsed: boolean,
): MenuProps['items'] => {
  const toMenuItem = (item: AppNavigationGroup['items'][number]) => ({
    icon: collapsed ? (
      <Tooltip placement="right" title={item.label}>
        <span>{item.icon}</span>
      </Tooltip>
    ) : (
      item.icon
    ),
    key: item.key,
    label: <Link to={item.to}>{item.label}</Link>,
    title: item.label,
  });

  if (collapsed) {
    return navigation.flatMap((group) => group.items.map(toMenuItem));
  }

  return navigation.map((group) => ({
    children: group.items.map(toMenuItem),
    key: group.key,
    label: group.label,
    type: 'group' as const,
  }));
};

export const AppNavigationMenu = ({ collapsed = false }: AppNavigationMenuProps) => {
  const { token } = theme.useToken();
  const viewport = useViewport();
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const { closeMobileSidebar, navigation, selectedNavigationKey } = useAppShell();
  const items = useMemo(() => toMenuItems(navigation, collapsed), [collapsed, navigation]);

  return (
    <nav
      aria-label="Основная навигация"
      style={{ height: '100%', minHeight: 0, overflowY: 'auto' }}
    >
      <Menu
        inlineCollapsed={collapsed}
        items={items}
        mode="inline"
        selectedKeys={selectedNavigationKey ? [selectedNavigationKey] : []}
        style={{ background: token.colorBgContainer, borderInlineEnd: 0 }}
        theme={colorScheme}
        onClick={viewport === 'mobile' ? closeMobileSidebar : undefined}
      />
    </nav>
  );
};
