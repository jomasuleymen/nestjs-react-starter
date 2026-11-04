import { useContext } from 'react';

import { AppShellContext, type AppShellContextValue } from './appShellContext';

export const useAppShell = (): AppShellContextValue => {
  const value = useContext(AppShellContext);
  if (value === null) {
    throw new Error('useAppShell must be used within AppShellProvider');
  }

  return value;
};
