import { Typography, theme } from 'antd';
import { useId, type ReactNode } from 'react';

export interface PageLayoutProps {
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
}

export const PageLayout = ({ actions, children, description, title }: PageLayoutProps) => {
  const { token } = theme.useToken();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: token.margin,
          marginBlockEnd: token.marginLG,
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <Typography.Title
            id={titleId}
            level={1}
            style={{ margin: 0, fontSize: token.fontSizeHeading2 }}
          >
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Paragraph style={{ marginBlock: `${token.marginXS}px 0` }} type="secondary">
              {description}
            </Typography.Paragraph>
          ) : null}
        </div>
        {actions ? <div style={{ maxWidth: '100%' }}>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
};
