'use client';

import { getRegistrations } from '@/lib/client/registration';
import { QUERY_KEYS } from '@/lib/consts';
import { useQuery } from '@tanstack/react-query';

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
