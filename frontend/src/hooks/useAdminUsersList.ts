'use client';

import { getAdminUsers } from '@/lib/client/admin';
import { QUERY_KEYS } from '@/lib/consts';
import { useQuery } from '@tanstack/react-query';

export function useAdminUsersList() {
  const query = useQuery({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: getAdminUsers,
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
  };
}
