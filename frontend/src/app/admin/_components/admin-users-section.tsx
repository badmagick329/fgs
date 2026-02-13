'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminUserActions } from '@/hooks/useAdminUserActions';
import { useAdminUsersList } from '@/hooks/useAdminUsersList';

export function AdminUsersSection() {
  const adminUsersQuery = useAdminUsersList();
  const { status, isMutating, handleToggleSuperAdmin, handleRemoveAdmin } =
    useAdminUserActions();
  const adminData = adminUsersQuery.data;
  const actionButtonBaseClass =
    'inline-flex items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

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
            ) : adminData && adminData.admins.length > 0 ? (
              adminData.admins.map((admin) => {
                const canManage =
                  adminData.currentAdminIsSuperAdmin &&
                  admin.id !== adminData.currentAdminId;
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
                      ) : admin.id === adminData.currentAdminId ? (
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
