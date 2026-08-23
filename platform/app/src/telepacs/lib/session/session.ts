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
  is_staff: boolean;
}

const SESSION_KEY = 'telepacs.session.v1';
const SESSION_EVENT = 'telepacs:session-changed';

export function readSession(): AuthSession | null {
  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    if (!value) {
      const previousTabSession = window.sessionStorage.getItem(SESSION_KEY);
      if (previousTabSession) {
        window.localStorage.setItem(SESSION_KEY, previousTabSession);
        window.sessionStorage.removeItem(SESSION_KEY);
        return JSON.parse(previousTabSession) as AuthSession;
      }
    }
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null): void {
  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  }
  window.dispatchEvent(new CustomEvent(SESSION_EVENT));
}

export function subscribeToSession(listener: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) listener();
  };
  window.addEventListener(SESSION_EVENT, listener);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(SESSION_EVENT, listener);
    window.removeEventListener('storage', handleStorage);
  };
}
