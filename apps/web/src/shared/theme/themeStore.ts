import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorScheme = 'light' | 'dark';

interface ThemeState {
  colorScheme: ColorScheme;
  setColorScheme: (colorScheme: ColorScheme) => void;
}

const getPreferredColorScheme = (): ColorScheme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colorScheme: getPreferredColorScheme(),
      setColorScheme: (colorScheme) => set({ colorScheme }),
    }),
    {
      name: 'starter-color-scheme',
      partialize: ({ colorScheme }) => ({ colorScheme }),
    },
  ),
);
