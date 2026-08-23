import { expect, it } from '@jest/globals';

import { accountEntryPath } from './accountRouting';

it('routes internal staff directly to the admin panel', () => {
  expect(accountEntryPath('ACTIVE', '09000000000', true)).toBe('/admin');
});

it('preserves the physician account flow for non-staff users', () => {
  expect(accountEntryPath('ONBOARDING', '09121234567')).toBe('/onboarding');
  expect(accountEntryPath('PENDING_REVIEW', '09121234567')).toBe('/reviewing');
  expect(accountEntryPath('ACTIVE', '09121234567')).toBe('/app');
  expect(accountEntryPath('REJECTED', '09121234567')).toBe('/app/review');
});
