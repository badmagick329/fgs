'use client';

import { API, QUERY_KEYS } from '@/lib/consts';
import { emailWorkerStatusResultSchema } from '@/types';
import { useQuery } from '@tanstack/react-query';

export default function useRegistrationEmailStatus() {
  const q = useQuery({
    queryKey: QUERY_KEYS.registrationEmailStatus,
    queryFn: async () => {
      const res = await fetch(API.registerStatus);
      if (res.status === 401) {
        throw new Error('Authentication required.');
      }
      if (!res.ok) {
        throw new Error('Failed to load email worker status.');
      }
      const json = await res.json();
      const parsed = emailWorkerStatusResultSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }
      if (!parsed.data.ok) {
        throw new Error(json.message ?? 'Failed to load email worker status.');
      }
      return parsed.data.data;
    },
    refetchInterval: 30_000,
  });

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    data: q.data ?? null,
  };
}
