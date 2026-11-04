import { Alert, Button, Card, Form, Input, theme, Typography } from 'antd';
import { useState } from 'react';

import { isApiError } from '@api/http';
import { ColorSchemeSwitch } from '@shared/theme/ColorSchemeSwitch';

import { authSession, type LoginCredentials } from '../model/authStore';

interface LoginPageProps {
  notice?: string;
  onSuccess: () => void;
}

export const LoginPage = ({ notice, onSuccess }: LoginPageProps) => {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { token } = theme.useToken();

  const handleSubmit = async (values: LoginCredentials): Promise<void> => {
    setSubmitting(true);
    setErrorMessage(undefined);
    try {
      await authSession.login(values);
      onSuccess();
    } catch (error: unknown) {
      setErrorMessage(isApiError(error) ? error.message : 'Не удалось выполнить операцию');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        display: 'grid',
        minHeight: '100vh',
        padding: token.padding,
        placeItems: 'center',
        background: token.colorBgLayout,
      }}
    >
      <Card size="small" style={{ width: 'min(100%, 360px)', boxShadow: token.boxShadowSecondary }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: token.marginSM,
          }}
        >
          <Typography.Title level={2} style={{ margin: 0 }}>
            Starter
          </Typography.Title>
          <ColorSchemeSwitch />
        </div>
        <Typography.Paragraph
          style={{ marginBlock: `${token.marginXS}px ${token.margin}px` }}
          type="secondary"
        >
          Войдите, чтобы продолжить работу.
        </Typography.Paragraph>
        {notice ? (
          <Alert showIcon style={{ marginBottom: token.margin }} title={notice} type="warning" />
        ) : null}
        {errorMessage ? (
          <Alert
            showIcon
            style={{ marginBottom: token.margin }}
            title={errorMessage}
            type="error"
          />
        ) : null}
        <Form<LoginCredentials>
          layout="vertical"
          onFinish={(values) => void handleSubmit(values)}
          requiredMark={false}
        >
          <Form.Item
            label="Логин"
            name="login"
            rules={[
              { required: true, message: 'Введите логин' },
              { min: 3, max: 50, message: 'Логин должен содержать от 3 до 50 символов' },
            ]}
          >
            <Input autoComplete="username" autoFocus />
          </Form.Item>
          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { max: 128, message: 'Пароль не должен превышать 128 символов' },
            ]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button block htmlType="submit" loading={submitting} type="primary">
            Войти
          </Button>
        </Form>
      </Card>
    </main>
  );
};
