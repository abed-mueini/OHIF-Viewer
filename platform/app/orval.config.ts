import { fileURLToPath } from 'node:url';

const defaultSchema = fileURLToPath(
  new URL('../../../backend/openapi/openapi-v1.yaml', import.meta.url)
);

export default {
  telepacs: {
    input: {
      target: process.env.TELEPACS_OPENAPI_SCHEMA || defaultSchema,
      override: {
        transformer: schema => {
          const operation = schema.paths?.['/api/v1/me/doctor-profile/']?.patch;
          const requestBody = operation?.requestBody;
          if (requestBody && 'content' in requestBody) {
            const multipart = requestBody.content?.['multipart/form-data'];
            if (multipart) {
              requestBody.content = { 'multipart/form-data': multipart };
            }
          }
          return schema;
        },
      },
    },
    output: {
      target: './src/telepacs/api/generated/telepacs.ts',
      schemas: './src/telepacs/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      mode: 'tags-split',
      clean: true,
      mock: false,
      prettier: true,
      override: {
        mutator: {
          path: './src/telepacs/lib/http/client.ts',
          name: 'apiClient',
        },
        query: {
          signal: true,
        },
        formData: true,
      },
    },
  },
};
