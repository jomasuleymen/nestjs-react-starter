import { createContext } from 'react';

import type { AuthUser } from '@modules/auth';

import type { AppNavigationGroup } from '../appNavigation';

export interface AppShellContextValue {
  closeMobileSidebar: () => void;
  logout: () => Promise<void>;
  mobileSidebarOpen: boolean;
  navigation: readonly AppNavigationGroup[];
  selectedNavigationKey?: string;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  user: AuthUser;
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);
