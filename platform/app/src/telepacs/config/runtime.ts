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

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function resolveApiOrigin(): string {
  const configured = window.config?.telepacsApiBaseUrl;

  // Production intentionally uses a same-origin `/api/v1` value so a reverse
  // proxy can route requests. When that build is previewed locally, however,
  // there is no such proxy and the Django API listens on port 8000.
  if (
    isLocalHostname(window.location.hostname) &&
    (!configured || !isAbsoluteHttpUrl(configured))
  ) {
    return `http://${window.location.hostname}:8000`;
  }

  if (configured) {
    return stripApiPath(configured);
  }

  return '';
}

export const runtimeConfig = Object.freeze({
  apiOrigin: resolveApiOrigin(),
  termsVersion: window.config?.telepacsTermsVersion || '2026-01',
  privacyVersion: window.config?.telepacsPrivacyVersion || '2026-01',
});
