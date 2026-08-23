import { useCallback, useRef, useState } from 'react';

import { errorMessage } from '../../../lib/http/errors';

interface PreviewRequest {
  title: string;
  mimeType?: string;
  downloadName?: string;
  load: () => Promise<Blob>;
}

interface PreviewState {
  open: boolean;
  title: string;
  mimeType?: string;
  downloadName?: string;
  blob: Blob | null;
  loading: boolean;
  error: string;
}

const initialState: PreviewState = {
  open: false,
  title: '',
  blob: null,
  loading: false,
  error: '',
};

export function usePrivateFilePreview() {
  const requestId = useRef(0);
  const [preview, setPreview] = useState<PreviewState>(initialState);

  const openPreview = useCallback(
    async ({ title, mimeType, downloadName, load }: PreviewRequest) => {
      const activeRequest = ++requestId.current;
      setPreview({
        open: true,
        title,
        mimeType,
        downloadName,
        blob: null,
        loading: true,
        error: '',
      });
      try {
        const blob = await load();
        if (requestId.current !== activeRequest) return;
        setPreview({
          open: true,
          title,
          mimeType,
          downloadName,
          blob,
          loading: false,
          error: '',
        });
      } catch (error) {
        if (requestId.current !== activeRequest) return;
        setPreview({
          open: true,
          title,
          mimeType,
          downloadName,
          blob: null,
          loading: false,
          error: errorMessage(error),
        });
      }
    },
    []
  );

  const closePreview = useCallback(() => {
    requestId.current += 1;
    setPreview(initialState);
  }, []);

  return { preview, openPreview, closePreview };
}
