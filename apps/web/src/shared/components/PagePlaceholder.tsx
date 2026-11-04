import { Card, Col, Row, theme } from 'antd';

import { PageLayout } from './PageLayout';

interface PagePlaceholderProps {
  description: string;
  title: string;
}

export const PagePlaceholder = ({ description, title }: PagePlaceholderProps) => {
  const { token } = theme.useToken();

  return (
    <PageLayout description={description} title={title}>
      <Row gutter={[token.margin, token.margin]}>
        {[0, 1, 2].map((item) => (
          <Col key={item} lg={8} md={12} sm={24} xs={24}>
            <Card style={{ minHeight: 160 }} />
          </Col>
        ))}
      </Row>
    </PageLayout>
  );
};
