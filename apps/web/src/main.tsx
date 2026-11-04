import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@app/App';
import { bootstrapApp } from '@app/bootstrap';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element was not found');
}

const disposeApp = bootstrapApp();
if (import.meta.hot) {
  import.meta.hot.dispose(disposeApp);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
