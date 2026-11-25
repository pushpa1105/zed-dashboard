import { useMutation } from '@tanstack/react-query';

import { getErrorMessage } from '@/core/api/errors';
import { demoFormsApi } from '@/features/ui-forms/api/ui-forms-api';

/** Posts an auth demo action (`sign-in`, `otp`, `unlock`…) and exposes a ready-to-show error. */
export function useAuthAction(action: string, onSuccess?: () => void) {
  const mutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => demoFormsApi.auth(action, input),
    onSuccess: () => onSuccess?.(),
  });
  return {
    run: mutation.mutate,
    pending: mutation.isPending,
    error: mutation.isError ? getErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}
