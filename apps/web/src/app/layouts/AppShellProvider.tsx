import { useLocation } from '@tanstack/react-router';
import { useMemo, type ReactNode } from 'react';

import { authSession, type AuthUser } from '@modules/auth';
import { useViewport } from '@shared/hooks/useViewport';

import { getAccessibleNavigation, getSelectedNavigationKey } from '../appNavigation';

import { AppShellContext, type AppShellContextValue } from './appShellContext';
import { useSidebarController } from './useSidebarController';

interface AppShellProviderProps {
  children: ReactNode;
  user: AuthUser;
}

export const AppShellProvider = ({ children, user }: AppShellProviderProps) => {
  const location = useLocation();
  const viewport = useViewport();
  const sidebar = useSidebarController(viewport);
  const navigation = useMemo(() => getAccessibleNavigation(user), [user]);
  const selectedNavigationKey = useMemo(
    () => getSelectedNavigationKey(navigation, location.pathname),
    [location.pathname, navigation],
  );

  const value = useMemo<AppShellContextValue>(
    () => ({
      logout: authSession.logout,
      navigation,
      selectedNavigationKey,
      ...sidebar,
      user,
    }),
    [navigation, selectedNavigationKey, sidebar, user],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
};
