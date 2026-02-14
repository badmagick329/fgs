'use client';

import { API, QUERY_KEYS } from '@/lib/consts';
import { registrationListResultSchema } from '@/types';
import { useQuery } from '@tanstack/react-query';

export default function useRegistrationList() {
  const q = useQuery({
    queryKey: QUERY_KEYS.registrations,
    queryFn: async () => {
      const res = await fetch(API.register);
      if (res.status === 401) {
        throw new Error('Authentication required.');
      }
      if (!res.ok) {
        throw new Error('Failed to load registrations.');
      }
      const json = await res.json();
      const parsed = registrationListResultSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }
      if (!parsed.data.ok) {
        throw new Error(json.message ?? 'Failed to load registrations.');
      }
      return parsed.data.data ?? [];
    },
  });

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    data: q.data ?? [],
  };
}
