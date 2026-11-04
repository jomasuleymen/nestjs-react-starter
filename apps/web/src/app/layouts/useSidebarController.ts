import { useCallback, useMemo, useState } from 'react';

import type { Viewport } from '@shared/hooks/useViewport';

interface SidebarController {
  closeMobileSidebar: () => void;
  mobileSidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useSidebarController = (viewport: Viewport): SidebarController => {
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [tabletSidebarCollapsed, setTabletSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => {
    switch (viewport) {
      case 'mobile':
        setMobileSidebarOpen((open) => !open);
        break;
      case 'tablet':
        setTabletSidebarCollapsed((collapsed) => !collapsed);
        break;
      case 'desktop':
        setDesktopSidebarCollapsed((collapsed) => !collapsed);
        break;
    }
  }, [viewport]);

  const sidebarCollapsed = viewport === 'tablet' ? tabletSidebarCollapsed : desktopSidebarCollapsed;

  return useMemo(
    () => ({
      closeMobileSidebar,
      mobileSidebarOpen,
      sidebarCollapsed,
      toggleSidebar,
    }),
    [closeMobileSidebar, mobileSidebarOpen, sidebarCollapsed, toggleSidebar],
  );
};
