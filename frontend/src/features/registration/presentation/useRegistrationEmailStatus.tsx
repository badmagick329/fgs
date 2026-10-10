'use client';

import { getRegistrationEmailStatus } from '@/features/registration/presentation/registration-client';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/consts';

export default function useRegistrationEmailStatus() {
  const q = useQuery({
    queryKey: QUERY_KEYS.registrationEmailStatus,
    queryFn: getRegistrationEmailStatus,
    refetchInterval: 30_000,
  });

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    data: q.data ?? null,
  };
}
