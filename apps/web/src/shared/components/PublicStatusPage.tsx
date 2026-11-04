import { Link } from '@tanstack/react-router';
import { Button, Result, theme } from 'antd';

interface PublicStatusPageProps {
  status: '403' | '404';
  subTitle: string;
  title: string;
}

export const PublicStatusPage = ({ status, subTitle, title }: PublicStatusPageProps) => {
  const { token } = theme.useToken();

  return (
    <main
      style={{
        display: 'grid',
        minHeight: '100vh',
        padding: 24,
        placeItems: 'center',
        background: token.colorBgLayout,
      }}
    >
      <Result
        extra={
          <Link to="/">
            <Button type="primary">На главную</Button>
          </Link>
        }
        status={status}
        subTitle={subTitle}
        title={title}
      />
    </main>
  );
};
