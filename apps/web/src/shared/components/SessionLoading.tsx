import { Card, Skeleton, theme } from 'antd';

export const SessionLoading = () => {
  const { token } = theme.useToken();

  return (
    <main
      aria-busy="true"
      aria-label="Восстановление сессии"
      style={{
        display: 'grid',
        minHeight: '100vh',
        padding: 24,
        placeItems: 'center',
        background: token.colorBgLayout,
      }}
    >
      <Card style={{ width: 'min(100%, 480px)' }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    </main>
  );
};
