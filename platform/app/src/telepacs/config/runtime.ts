declare global {
  interface Window {
    config?: {
      telepacsApiBaseUrl?: string;
      telepacsTermsVersion?: string;
      telepacsPrivacyVersion?: string;
    };
  }
}

function stripApiPath(value: string): string {
  return value.replace(/\/$/, '').replace(/\/api\/v1$/, '');
}

function resolveApiOrigin(): string {
  const configured = window.config?.telepacsApiBaseUrl;
  if (configured) {
    return stripApiPath(configured);
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return '';
}

export const runtimeConfig = Object.freeze({
  apiOrigin: resolveApiOrigin(),
  termsVersion: window.config?.telepacsTermsVersion || '2026-01',
  privacyVersion: window.config?.telepacsPrivacyVersion || '2026-01',
});
