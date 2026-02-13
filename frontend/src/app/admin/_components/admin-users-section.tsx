'use client';

import {
  adminActionResponseSchema,
  adminUsersResponseSchema,
} from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type AdminUsersData = {
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

export function AdminUsersSection() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const adminUsersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });

  const toggleSuperAdminMutation = useMutation({
    mutationFn: async ({
      adminId,
      isSuperAdmin,
    }: {
      adminId: number;
      isSuperAdmin: boolean;
    }) => {
      const res = await fetch(`/api/admin/users/${adminId}/super-admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuperAdmin }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message ?? 'Failed to update super admin status.');
      }
      return json;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (adminId: number) => {
      const res = await fetch(`/api/admin/users/${adminId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message ?? 'Failed to remove admin.');
      }
      const parsed = adminActionResponseSchema.safeParse(json);
      if (!parsed.success || !parsed.data.ok) {
        throw new Error(json?.message ?? 'Failed to remove admin.');
      }
      return parsed.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const isMutating =
    toggleSuperAdminMutation.isPending || removeAdminMutation.isPending;
  const actionButtonBaseClass =
    'inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  const handleToggleSuperAdmin = async (args: {
    adminId: number;
    email: string;
    nextIsSuperAdmin: boolean;
    currentIsSuperAdmin: boolean;
  }) => {
    setStatus(null);

    if (args.currentIsSuperAdmin && !args.nextIsSuperAdmin) {
      const confirmed = window.confirm(
        `Revoke super admin from ${args.email}?`
      );
      if (!confirmed) {
        return;
      }
    }

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
    const confirmed = window.confirm(`Remove admin account ${args.email}?`);
    if (!confirmed) {
      return;
    }

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

  return (
    <section className='fgs-card lg:col-span-2'>
      <h3 className='fgs-subheading'>Admin Access</h3>
      <p className='fgs-copy mt-2'>
        View admins and manage super admin access.
      </p>

      {adminUsersQuery.isError && (
        <p className='mt-4 text-sm text-error'>
          {adminUsersQuery.error instanceof Error
            ? adminUsersQuery.error.message
            : 'Failed to load admins.'}
        </p>
      )}

      {status && (
        <p
          className={`mt-4 text-sm ${status.tone === 'error' ? 'text-error' : 'text-fgs-ink'}`}
        >
          {status.message}
        </p>
      )}

      <div className='mt-4 rounded-xl border border-border bg-card p-2 sm:p-3'>
        <Table>
          <TableHeader>
            <TableRow className='bg-fgs-surface hover:bg-fgs-surface'>
              <TableHead className='font-semibold'>Email</TableHead>
              <TableHead className='font-semibold'>Created</TableHead>
              <TableHead className='font-semibold'>Role</TableHead>
              <TableHead className='font-semibold'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminUsersQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className='py-8 text-center text-sm'>
                  Loading admins...
                </TableCell>
              </TableRow>
            ) : adminUsersQuery.data?.admins.length ? (
              adminUsersQuery.data.admins.map((admin) => {
                const canManage =
                  adminUsersQuery.data.currentAdminIsSuperAdmin &&
                  admin.id !== adminUsersQuery.data.currentAdminId;
                const createdAt = new Date(admin.created_at);
                return (
                  <TableRow
                    key={admin.id}
                    className='odd:bg-card even:bg-fgs-surface/55'
                  >
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{createdAt.toLocaleString()}</TableCell>
                    <TableCell>
                      {admin.is_super_admin ? (
                        <span className='fgs-chip'>Super Admin</span>
                      ) : (
                        <span className='inline-flex items-center rounded-full border border-border bg-fgs-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground'>
                          Admin
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <div className='flex flex-wrap gap-2'>
                          <button
                            type='button'
                            className={`${actionButtonBaseClass} border-fgs-blue/55 text-fgs-blue hover:bg-fgs-blue/8`}
                            disabled={isMutating}
                            onClick={() =>
                              void handleToggleSuperAdmin({
                                adminId: admin.id,
                                email: admin.email,
                                currentIsSuperAdmin: admin.is_super_admin,
                                nextIsSuperAdmin: !admin.is_super_admin,
                              })
                            }
                          >
                            {admin.is_super_admin
                              ? 'Revoke Super'
                              : 'Make Super'}
                          </button>
                          <button
                            type='button'
                            className={`${actionButtonBaseClass} border-red-300 text-red-600 hover:bg-red-50`}
                            disabled={isMutating}
                            onClick={() =>
                              void handleRemoveAdmin({
                                adminId: admin.id,
                                email: admin.email,
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ) : admin.id === adminUsersQuery.data.currentAdminId ? (
                        <span className='text-sm text-muted-foreground'>
                          Current account
                        </span>
                      ) : (
                        <span className='text-sm text-muted-foreground'>
                          Read only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className='py-8 text-center text-sm'>
                  No admins found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
