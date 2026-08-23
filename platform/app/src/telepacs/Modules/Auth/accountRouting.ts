import type { AccountStatusEnum } from '../../api/generated/model';

function toLocalIranMobile(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('+98')) return `0${value.slice(3)}`;
  return value;
}

export function accountEntryPath(
  status: AccountStatusEnum,
  mobileNumber?: string,
  isStaff = false
): string {
  if (isStaff) return '/admin';
  if (status === 'PENDING_VERIFICATION') {
    const localMobile = toLocalIranMobile(mobileNumber);
    const query = localMobile ? `?mobile_number=${encodeURIComponent(localMobile)}` : '';
    return `/verify${query}`;
  }
  if (status === 'ONBOARDING') return '/onboarding';
  if (status === 'PENDING_REVIEW') return '/reviewing';
  if (status === 'ACTIVE') return '/app';
  return '/account-unavailable';
}
