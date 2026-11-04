import { Layout, theme } from 'antd';
import type { ReactNode } from 'react';

import { useViewport } from '@shared/hooks/useViewport';

import { appLayoutConfig } from './appLayoutConfig';

interface PageContentProps {
  children: ReactNode;
}

export const PageContent = ({ children }: PageContentProps) => {
  const { token } = theme.useToken();
  const viewport = useViewport();
  const padding =
    viewport === 'mobile'
      ? token.paddingSM
      : viewport === 'tablet'
        ? token.padding
        : token.paddingLG;

  return (
    <Layout.Content
      style={{
        minHeight: 0,
        overflow: 'auto',
        padding,
        background: token.colorBgLayout,
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: appLayoutConfig.contentMaxWidth,
          minWidth: 0,
          marginInline: 'auto',
        }}
      >
        {children}
      </main>
    </Layout.Content>
  );
};
