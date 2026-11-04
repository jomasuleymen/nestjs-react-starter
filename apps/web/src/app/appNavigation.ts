import { AppstoreOutlined, FileTextOutlined } from '@ant-design/icons';
import { createElement, type ReactNode } from 'react';

import { ACCESS_RULES, canAccess, type AccessRule, type AuthUser } from '@modules/auth';

import type { FileRoutesByTo } from '../routeTree.gen';

export interface AppNavigationItem {
  access: AccessRule;
  icon: ReactNode;
  key: string;
  label: string;
  to: keyof FileRoutesByTo;
}

export interface AppNavigationGroup {
  items: readonly AppNavigationItem[];
  key: string;
  label: string;
}

export const appNavigation = [
  {
    items: [
      {
        access: ACCESS_RULES.WORKSPACE,
        icon: createElement(AppstoreOutlined),
        key: 'workspace',
        label: 'Рабочее пространство',
        to: '/workspace',
      },
      {
        access: ACCESS_RULES.FILES,
        icon: createElement(FileTextOutlined),
        key: 'files',
        label: 'Файлы',
        to: '/files',
      },
    ],
    key: 'work',
    label: 'Работа',
  },
] as const satisfies readonly AppNavigationGroup[];

export const getAccessibleNavigation = (user: AuthUser): readonly AppNavigationGroup[] =>
  appNavigation.reduce<AppNavigationGroup[]>((groups, group) => {
    const items = group.items.filter((item) => canAccess(user, item.access));

    if (items.length > 0) {
      groups.push({ ...group, items });
    }

    return groups;
  }, []);

export const getSelectedNavigationKey = (
  navigation: readonly AppNavigationGroup[],
  pathname: string,
): string | undefined => {
  let selectedItem: AppNavigationItem | undefined;

  for (const group of navigation) {
    for (const item of group.items) {
      const matches = pathname === item.to || pathname.startsWith(`${item.to}/`);
      if (matches && (selectedItem === undefined || item.to.length > selectedItem.to.length)) {
        selectedItem = item;
      }
    }
  }

  return selectedItem?.key;
};
