import { Avatar, Typography, theme } from 'antd';
import type { ReactNode } from 'react';

import { appLayoutConfig } from './appLayoutConfig';

interface AppBrandProps {
  collapsed?: boolean;
  extra?: ReactNode;
}

export const AppBrand = ({ collapsed = false, extra }: AppBrandProps) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        display: 'flex',
        height: appLayoutConfig.headerHeight,
        alignItems: 'center',
        gap: token.marginSM,
        paddingInline: collapsed ? token.paddingSM : token.padding,
      }}
    >
      <Avatar
        shape="square"
        size="small"
        style={{ background: token.colorPrimaryBg, color: token.colorPrimary, fontWeight: 700 }}
      >
        S
      </Avatar>
      {!collapsed ? (
        <Typography.Text ellipsis strong style={{ fontSize: token.fontSizeLG, minWidth: 0 }}>
          Starter
        </Typography.Text>
      ) : null}
      {extra ? <div style={{ marginInlineStart: 'auto' }}>{extra}</div> : null}
    </div>
  );
};
