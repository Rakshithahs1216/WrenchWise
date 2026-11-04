import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { servicesApi } from '../api/services';
import type { Service, ServiceStatus } from '../types';
import { errorMessage } from '../utils/errors';
import { SERVICE_STATUS_META } from '../utils/status';
import { SERVICE_DEPENDENT_KEYS } from './queryKeys';
import { useApiMutation } from './useApiMutation';

type ServiceListSnapshot = [readonly unknown[], Service[] | undefined][];

/** Status change with an optimistic update of every cached service list. */
export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation<Service, unknown, { id: string; status: ServiceStatus }, { snapshot: ServiceListSnapshot }>({
    mutationFn: ({ id, status }) => servicesApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['services'] });
      const snapshot = queryClient.getQueriesData<Service[]>({ queryKey: ['services'] });
      queryClient.setQueriesData<Service[]>({ queryKey: ['services'] }, (list) =>
        list?.map((s) => (s.id === id ? { ...s, status } : s)),
      );
      return { snapshot };
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData<Service[]>(key, data));
      toast.error(errorMessage(error));
    },
    onSuccess: (service) => toast.success(`Marked as ${SERVICE_STATUS_META[service.status].label.toLowerCase()}`),
    onSettled: () =>
      Promise.all(SERVICE_DEPENDENT_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

export function useAddServiceNote(onAdded?: () => void) {
  return useApiMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => servicesApi.addNote(id, text),
    invalidate: SERVICE_DEPENDENT_KEYS,
    successMessage: 'Note added',
    onSuccess: () => onAdded?.(),
  });
}
