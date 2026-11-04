import { createFileRoute } from '@tanstack/react-router';

import { PublicStatusPage } from '@shared/components/PublicStatusPage';

const NotFoundPage = () => (
  <PublicStatusPage
    status="404"
    subTitle="Проверьте адрес или вернитесь на стартовую страницу."
    title="Страница не найдена"
  />
);

export const Route = createFileRoute('/(system)/not-found')({
  component: NotFoundPage,
});
