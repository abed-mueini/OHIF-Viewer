import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { toApiError } from '../http/errors';

export function applyApiFormErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>
): string {
  const apiError = toApiError(error);
  for (const [field, message] of Object.entries(apiError.fieldErrors)) {
    setError(field as Path<TValues>, { type: 'server', message });
  }
  return apiError.message;
}
