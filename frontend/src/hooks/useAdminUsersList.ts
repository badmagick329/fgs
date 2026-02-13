'use client';

import { adminUsersResponseSchema } from '@/types';
import { useQuery } from '@tanstack/react-query';

export type AdminUsersData = {
  currentAdminId: number;
  currentAdminEmail: string;
  currentAdminIsSuperAdmin: boolean;
  admins: Array<{
    id: number;
    email: string;
    created_at: string;
    is_super_admin: boolean;
  }>;
};

async function getAdminUsers() {
  const res = await fetch('/api/admin/users');
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message ?? 'Failed to load admin users.');
  }
  const json = await res.json().catch(() => null);
  const parsed = adminUsersResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Invalid response from server.');
  }
  return parsed.data.data as AdminUsersData;
}

export function useAdminUsersList() {
  const query = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
  };
}
