'use client';

import { getAdminUsers } from '@/features/admin/presentation/admin-client';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/consts';

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
