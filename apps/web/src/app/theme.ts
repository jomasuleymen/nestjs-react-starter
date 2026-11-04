import { theme, type ThemeConfig } from 'antd';

import type { ColorScheme } from '@shared/theme/themeStore';

const sharedTheme: ThemeConfig = {
  components: {
    Form: {
      itemMarginBottom: 16,
    },
  },
  token: {
    borderRadius: 8,
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};

export const appThemes = {
  light: {
    ...sharedTheme,
    algorithm: theme.defaultAlgorithm,
  },
  dark: {
    ...sharedTheme,
    algorithm: theme.darkAlgorithm,
  },
} satisfies Record<ColorScheme, ThemeConfig>;
