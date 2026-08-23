import { beforeEach, expect, it, jest } from '@jest/globals';

import { readSession, saveSession, subscribeToSession, type AuthSession } from './session';

const session: AuthSession = {
  access: 'access-token',
  refresh: 'refresh-token',
  account_status: 'ACTIVE',
  access_expires_in: 300,
  refresh_expires_in: 3600,
  is_staff: true,
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

it('stores authentication in local storage so it is shared with new tabs', () => {
  saveSession(session);

  expect(readSession()).toEqual(session);
  expect(window.localStorage.getItem('telepacs.session.v1')).toBe(JSON.stringify(session));
  expect(window.sessionStorage.getItem('telepacs.session.v1')).toBeNull();
});

it('migrates the previous tab-scoped session to local storage', () => {
  window.sessionStorage.setItem('telepacs.session.v1', JSON.stringify(session));

  expect(readSession()).toEqual(session);
  expect(window.localStorage.getItem('telepacs.session.v1')).toBe(JSON.stringify(session));
  expect(window.sessionStorage.getItem('telepacs.session.v1')).toBeNull();
});

it('notifies the current tab and other tabs when authentication changes', () => {
  const listener = jest.fn();
  const unsubscribe = subscribeToSession(listener);

  saveSession(session);
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'telepacs.session.v1',
      newValue: JSON.stringify(session),
    })
  );

  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
});

it('clears both current and legacy session stores on logout', () => {
  window.localStorage.setItem('telepacs.session.v1', JSON.stringify(session));
  window.sessionStorage.setItem('telepacs.session.v1', JSON.stringify(session));

  saveSession(null);

  expect(readSession()).toBeNull();
  expect(window.localStorage.getItem('telepacs.session.v1')).toBeNull();
  expect(window.sessionStorage.getItem('telepacs.session.v1')).toBeNull();
});
