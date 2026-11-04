import { createFileRoute } from '@tanstack/react-router';

import { PublicStatusPage } from '@shared/components/PublicStatusPage';

const NoAccessPage = () => (
  <PublicStatusPage
    status="403"
    subTitle="У вашей роли нет разрешения для этого раздела."
    title="Недостаточно прав"
  />
);

export const Route = createFileRoute('/(system)/no-access')({
  component: NoAccessPage,
});
