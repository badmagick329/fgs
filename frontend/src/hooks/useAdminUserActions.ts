'use client';

import { removeAdmin, updateAdminSuperStatus } from '@/lib/client/admin';
import { QUERY_KEYS } from '@/lib/consts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type StatusState = {
  tone: 'success' | 'error';
  message: string;
} | null;

export function useAdminUserActions() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusState>(null);

  const toggleSuperAdminMutation = useMutation({
    mutationFn: updateAdminSuperStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: removeAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
    },
  });

  const handleToggleSuperAdmin = async (args: {
    adminId: number;
    email: string;
    nextIsSuperAdmin: boolean;
    currentIsSuperAdmin: boolean;
  }) => {
    setStatus(null);

    try {
      await toggleSuperAdminMutation.mutateAsync({
        adminId: args.adminId,
        isSuperAdmin: args.nextIsSuperAdmin,
      });
      setStatus({
        tone: 'success',
        message: args.nextIsSuperAdmin
          ? 'Super admin access granted.'
          : 'Super admin access revoked.',
      });
    } catch (error) {
      setStatus({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update super admin status.',
      });
    }
  };

  const handleRemoveAdmin = async (args: { adminId: number; email: string }) => {
    setStatus(null);

    try {
      await removeAdminMutation.mutateAsync(args.adminId);
      setStatus({ tone: 'success', message: 'Admin removed.' });
    } catch (error) {
      setStatus({
        tone: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to remove admin.',
      });
    }
  };

  return {
    status,
    isMutating:
      toggleSuperAdminMutation.isPending || removeAdminMutation.isPending,
    handleToggleSuperAdmin,
    handleRemoveAdmin,
  };
}
