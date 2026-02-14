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

type AdminUser = {
  id: number;
  email: string;
  created_at: string;
  is_super_admin: boolean;
};

type AdminUsersData = {
  admins: AdminUser[];
  currentAdminId: number;
  currentAdminIsSuperAdmin: boolean;
};

type AdminUsersListProps = {
  adminData: AdminUsersData;
  isMutating: boolean;
  actionButtonBaseClass: string;
  formatCreatedAt: (createdAtValue: string) => string;
  onToggleSuperAdmin: (args: {
    adminId: number;
    email: string;
    currentIsSuperAdmin: boolean;
    nextIsSuperAdmin: boolean;
  }) => Promise<void>;
  onRemoveAdmin: (args: { adminId: number; email: string }) => Promise<void>;
};

export function AdminUsersSection() {
  const adminUsersQuery = useAdminUsersList();
  const { status, isMutating, handleToggleSuperAdmin, handleRemoveAdmin } =
    useAdminUserActions();
  const adminData = adminUsersQuery.data;
  const actionButtonBaseClass =
    'inline-flex cursor-pointer items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  const formatCreatedAt = (createdAtValue: string) =>
    new Date(createdAtValue).toLocaleString();

  return (
    <section className='fgs-card min-w-0 lg:col-span-2'>
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

      <div className='mt-4 min-w-0 rounded-xl border border-border bg-card p-2 sm:p-3'>
        {adminUsersQuery.isLoading ? (
          <p className='py-8 text-center text-sm'>Loading admins...</p>
        ) : adminData && adminData.admins.length > 0 ? (
          <>
            <AdminUsersCardsList
              adminData={adminData}
              isMutating={isMutating}
              actionButtonBaseClass={actionButtonBaseClass}
              formatCreatedAt={formatCreatedAt}
              onToggleSuperAdmin={handleToggleSuperAdmin}
              onRemoveAdmin={handleRemoveAdmin}
            />
            <AdminUsersTable
              adminData={adminData}
              isMutating={isMutating}
              actionButtonBaseClass={actionButtonBaseClass}
              formatCreatedAt={formatCreatedAt}
              onToggleSuperAdmin={handleToggleSuperAdmin}
              onRemoveAdmin={handleRemoveAdmin}
            />
          </>
        ) : (
          <p className='py-8 text-center text-sm'>No admins found.</p>
        )}
      </div>
    </section>
  );
}

function AdminRoleBadge({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return isSuperAdmin ? (
    <span className='fgs-chip'>Super Admin</span>
  ) : (
    <span className='inline-flex items-center rounded-full border border-border bg-fgs-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground'>
      Admin
    </span>
  );
}

function AdminActionsCell({
  admin,
  adminData,
  isMutating,
  actionButtonBaseClass,
  onToggleSuperAdmin,
  onRemoveAdmin,
}: {
  admin: AdminUser;
  adminData: AdminUsersData;
  isMutating: boolean;
  actionButtonBaseClass: string;
  onToggleSuperAdmin: AdminUsersListProps['onToggleSuperAdmin'];
  onRemoveAdmin: AdminUsersListProps['onRemoveAdmin'];
}) {
  const canManage =
    adminData.currentAdminIsSuperAdmin && admin.id !== adminData.currentAdminId;

  if (canManage) {
    return (
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          className={`${actionButtonBaseClass} border-fgs-blue/55 text-fgs-blue hover:bg-fgs-blue/8`}
          disabled={isMutating}
          onClick={() =>
            void onToggleSuperAdmin({
              adminId: admin.id,
              email: admin.email,
              currentIsSuperAdmin: admin.is_super_admin,
              nextIsSuperAdmin: !admin.is_super_admin,
            })
          }
        >
          {admin.is_super_admin ? 'Revoke Super' : 'Make Super'}
        </button>
        <button
          type='button'
          className={`${actionButtonBaseClass} border-red-300 text-red-600 hover:bg-red-50`}
          disabled={isMutating}
          onClick={() =>
            void onRemoveAdmin({
              adminId: admin.id,
              email: admin.email,
            })
          }
        >
          Remove
        </button>
      </div>
    );
  }

  return admin.id === adminData.currentAdminId ? (
    <span className='text-sm text-muted-foreground'>Current account</span>
  ) : (
    <span className='text-sm text-muted-foreground'>Read only</span>
  );
}

function AdminUsersCardsList({
  adminData,
  isMutating,
  actionButtonBaseClass,
  formatCreatedAt,
  onToggleSuperAdmin,
  onRemoveAdmin,
}: AdminUsersListProps) {
  return (
    <div className='space-y-3 md:hidden'>
      {adminData.admins.map((admin) => (
        <article
          key={admin.id}
          className='rounded-lg border border-border bg-fgs-surface p-3'
        >
          <p className='text-xs font-semibold text-muted-foreground'>Email</p>
          <p className='mt-1 break-all text-sm'>{admin.email}</p>

          <p className='mt-3 text-xs font-semibold text-muted-foreground'>
            Created
          </p>
          <p className='mt-1 text-sm'>{formatCreatedAt(admin.created_at)}</p>

          <p className='mt-3 text-xs font-semibold text-muted-foreground'>
            Role
          </p>
          <div className='mt-1'>
            <AdminRoleBadge isSuperAdmin={admin.is_super_admin} />
          </div>

          <p className='mt-3 text-xs font-semibold text-muted-foreground'>
            Actions
          </p>
          <div className='mt-1'>
            <AdminActionsCell
              admin={admin}
              adminData={adminData}
              isMutating={isMutating}
              actionButtonBaseClass={actionButtonBaseClass}
              onToggleSuperAdmin={onToggleSuperAdmin}
              onRemoveAdmin={onRemoveAdmin}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function AdminUsersTable({
  adminData,
  isMutating,
  actionButtonBaseClass,
  formatCreatedAt,
  onToggleSuperAdmin,
  onRemoveAdmin,
}: AdminUsersListProps) {
  return (
    <div className='hidden md:block'>
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
          {adminData.admins.map((admin) => (
            <TableRow
              key={admin.id}
              className='odd:bg-card even:bg-fgs-surface/55'
            >
              <TableCell>{admin.email}</TableCell>
              <TableCell>{formatCreatedAt(admin.created_at)}</TableCell>
              <TableCell>
                <AdminRoleBadge isSuperAdmin={admin.is_super_admin} />
              </TableCell>
              <TableCell>
                <AdminActionsCell
                  admin={admin}
                  adminData={adminData}
                  isMutating={isMutating}
                  actionButtonBaseClass={actionButtonBaseClass}
                  onToggleSuperAdmin={onToggleSuperAdmin}
                  onRemoveAdmin={onRemoveAdmin}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
