import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { errorMessage } from '../utils/errors';

interface Options<TData, TVars> {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Query key prefixes to invalidate after success. */
  invalidate?: readonly QueryKey[];
  successMessage?: string | ((data: TData, vars: TVars) => string);
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (error: unknown) => void;
  /** Skip the error toast when the caller renders the error inline. */
  inlineError?: boolean;
}

/** react-query mutation with toasts and invalidate-on-success wired in. */
export function useApiMutation<TData = unknown, TVars = void>(options: Options<TData, TVars>) {
  const queryClient = useQueryClient();
  return useMutation<TData, unknown, TVars>({
    mutationFn: options.mutationFn,
    onSuccess: async (data, vars) => {
      await Promise.all((options.invalidate ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      const { successMessage } = options;
      if (successMessage) toast.success(typeof successMessage === 'function' ? successMessage(data, vars) : successMessage);
      options.onSuccess?.(data, vars);
    },
    onError: (error) => {
      if (!options.inlineError) toast.error(errorMessage(error));
      options.onError?.(error);
    },
  });
}
