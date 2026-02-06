'use client';

import { registrationListResultSchema } from '@/types';
import { useQuery } from '@tanstack/react-query';

export default function useRegistrationList() {
  const q = useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      const res = await fetch('/api/register');
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
