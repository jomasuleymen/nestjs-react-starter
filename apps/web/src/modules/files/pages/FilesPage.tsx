import { UploadOutlined } from '@ant-design/icons';
import { App, Button, Card, Upload } from 'antd';

import { isApiError } from '@api/http';
import { PageLayout } from '@shared/components/PageLayout';

import { createAntdUploadRequest } from '../adapters/antdUploadRequest';
import { useFileDelete, useFileDownload } from '../hooks/useFileMutations';
import type { FileRecord } from '../model/file';

const uploadRequest = createAntdUploadRequest();

export const FilesPage = () => {
  const { message } = App.useApp();
  const download = useFileDownload({
    onError: (error) => void message.error(error.message),
  });
  const remove = useFileDelete({
    onError: (error) => void message.error(error.message),
  });

  return (
    <PageLayout
      description="PDF, Word, Excel, JPEG, PNG и WebP до 50 МБ. Список содержит файлы, загруженные на этой странице."
      title="Файлы"
    >
      <Card>
        <Upload<FileRecord>
          customRequest={uploadRequest}
          locale={{ downloadFile: 'Скачать файл' }}
          multiple
          showUploadList={{ showDownloadIcon: true }}
          onChange={({ file }) => {
            if (file.status === 'error') {
              void message.error(
                isApiError(file.error) ? file.error.message : 'Не удалось загрузить файл',
              );
            }
          }}
          onDownload={(file) => {
            if (file.response) download.mutate({ fileId: file.response.id });
          }}
          onRemove={async (file) => {
            if (!file.response) return true;
            try {
              await remove.mutateAsync({ fileId: file.response.id });
              return true;
            } catch {
              return false;
            }
          }}
        >
          <Button icon={<UploadOutlined />}>Загрузить файл</Button>
        </Upload>
      </Card>
    </PageLayout>
  );
};
