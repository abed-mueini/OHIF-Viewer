export type AccountStatus =
  | 'PENDING_VERIFICATION'
  | 'ONBOARDING'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'CLOSED';

export interface AuthSession {
  access: string;
  refresh: string;
  account_status: AccountStatus;
  access_expires_in: number;
  refresh_expires_in: number;
}

const SESSION_KEY = 'telepacs.session.v1';
const SESSION_EVENT = 'telepacs:session-changed';

export function readSession(): AuthSession | null {
  try {
    const value = window.sessionStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null): void {
  if (session) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function subscribeToSession(listener: () => void): () => void {
  window.addEventListener(SESSION_EVENT, listener);
  return () => window.removeEventListener(SESSION_EVENT, listener);
}
