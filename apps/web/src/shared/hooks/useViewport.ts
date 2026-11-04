import { Grid } from 'antd';

export type Viewport = 'desktop' | 'mobile' | 'tablet';

export const useViewport = (): Viewport => {
  const screens = Grid.useBreakpoint();

  if (!screens.md) {
    return 'mobile';
  }

  return screens.lg ? 'desktop' : 'tablet';
};
