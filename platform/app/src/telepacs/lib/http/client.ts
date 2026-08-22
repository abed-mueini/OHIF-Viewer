import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { runtimeConfig } from '../../config/runtime';
import { readSession, saveSession, type AuthSession } from '../session/session';
import { ApiError, toApiError } from './errors';

interface RetryableRequest extends InternalAxiosRequestConfig {
  _telepacsRetried?: boolean;
}

const httpClient = axios.create({
  baseURL: runtimeConfig.apiOrigin,
  timeout: 30_000,
});

const refreshClient = axios.create({
  baseURL: runtimeConfig.apiOrigin,
  timeout: 15_000,
});

let refreshPromise: Promise<AuthSession> | null = null;

function refreshSession(): Promise<AuthSession> {
  if (refreshPromise) return refreshPromise;
  const session = readSession();
  if (!session?.refresh) {
    return Promise.reject(new ApiError(401, { code: 'authentication_required' }));
  }

  refreshPromise = refreshClient
    .post<Partial<AuthSession>>('/api/v1/auth/token/refresh/', { refresh: session.refresh })
    .then(response => {
      const next = {
        ...session,
        ...response.data,
        refresh: response.data.refresh || session.refresh,
      } as AuthSession;
      saveSession(next);
      return next;
    })
    .catch(error => {
      saveSession(null);
      throw toApiError(error);
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

httpClient.interceptors.request.use(config => {
  const session = readSession();
  if (session?.access) {
    config.headers.set('Authorization', `Bearer ${session.access}`);
  }
  config.headers.set('X-Request-ID', crypto.randomUUID());
  return config;
});

httpClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;
    const isAuthEndpoint = request?.url?.includes('/auth/token/');
    if (error.response?.status === 401 && request && !request._telepacsRetried && !isAuthEndpoint) {
      request._telepacsRetried = true;
      const session = await refreshSession();
      request.headers.set('Authorization', `Bearer ${session.access}`);
      return httpClient(request);
    }
    throw toApiError(error);
  }
);

export const apiClient = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const response = await httpClient.request<T>({ ...config, ...options });
  return response.data;
};

export type ErrorType<Error> = ApiError;
export type BodyType<BodyData> = BodyData;
