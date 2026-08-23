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

          // The public OpenAPI documents the standard response envelope. The
          // custom Axios client unwraps it at runtime, so generated hooks keep
          // their ergonomic domain return types here as well.
          Object.values(schema.paths || {}).forEach(pathItem => {
            if (!pathItem) return;
            Object.values(pathItem).forEach(operation => {
              if (!operation || typeof operation !== 'object' || !('responses' in operation)) {
                return;
              }
              Object.values(operation.responses || {}).forEach(response => {
                if (!response || !('content' in response)) return;
                Object.values(response.content || {}).forEach(media => {
                  const responseSchema = media?.schema;
                  if (
                    responseSchema &&
                    'properties' in responseSchema &&
                    responseSchema.properties?.data
                  ) {
                    media.schema = responseSchema.properties.data;
                  }
                });
              });
            });
          });
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
