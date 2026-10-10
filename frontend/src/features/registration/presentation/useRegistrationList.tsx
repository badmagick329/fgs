'use client';

import { getRegistrations } from '@/features/registration/presentation/registration-client';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/consts';

export default function useRegistrationList() {
  const q = useQuery({
    queryKey: QUERY_KEYS.registrations,
    queryFn: getRegistrations,
  });

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    data: q.data ?? [],
  };
}
