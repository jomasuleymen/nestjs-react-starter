import {
  createRootRouteWithContext,
  Outlet,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { Button, Result } from 'antd';

import { isApiError } from '@api/http';
import { PublicStatusPage } from '@shared/components/PublicStatusPage';
import { SessionLoading } from '@shared/components/SessionLoading';

import type { RouterContext } from './-context';

const NotFoundPage = () => (
  <PublicStatusPage
    status="404"
    subTitle="Проверьте адрес или вернитесь на стартовую страницу."
    title="Страница не найдена"
  />
);

const RouteErrorPage = ({ error, reset }: ErrorComponentProps) => (
  <Result
    extra={
      <Button onClick={reset} type="primary">
        Повторить
      </Button>
    }
    status="error"
    subTitle={
      isApiError(error) ? error.message : 'Произошла непредвиденная ошибка. Повторите попытку.'
    }
    title="Не удалось загрузить страницу"
  />
);

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  errorComponent: RouteErrorPage,
  notFoundComponent: NotFoundPage,
  pendingComponent: SessionLoading,
});
