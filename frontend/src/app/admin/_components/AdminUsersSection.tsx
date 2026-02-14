'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useState } from 'react';

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

type PendingAdminAction =
  | {
      type: 'toggle-super';
      adminId: number;
      email: string;
      currentIsSuperAdmin: boolean;
      nextIsSuperAdmin: boolean;
    }
  | {
      type: 'remove-admin';
      adminId: number;
      email: string;
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
  }) => void;
  onRemoveAdmin: (args: { adminId: number; email: string }) => void;
};

export function AdminUsersSection() {
  const adminUsersQuery = useAdminUsersList();
  const { status, isMutating, handleToggleSuperAdmin, handleRemoveAdmin } =
    useAdminUserActions();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(
    null
  );
  const adminData = adminUsersQuery.data;
  const actionButtonBaseClass =
    'inline-flex cursor-pointer items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  const formatCreatedAt = (createdAtValue: string) =>
    new Date(createdAtValue).toLocaleString();
  const requestToggleSuperAdmin = (args: {
    adminId: number;
    email: string;
    currentIsSuperAdmin: boolean;
    nextIsSuperAdmin: boolean;
  }) => {
    setPendingAction({ type: 'toggle-super', ...args });
    setIsConfirmDialogOpen(true);
  };
  const requestRemoveAdmin = (args: { adminId: number; email: string }) => {
    setPendingAction({ type: 'remove-admin', ...args });
    setIsConfirmDialogOpen(true);
  };
  const handleConfirmAction = async () => {
    if (!pendingAction || isMutating) {
      return;
    }
    try {
      if (pendingAction.type === 'toggle-super') {
        await handleToggleSuperAdmin({
          adminId: pendingAction.adminId,
          email: pendingAction.email,
          currentIsSuperAdmin: pendingAction.currentIsSuperAdmin,
          nextIsSuperAdmin: pendingAction.nextIsSuperAdmin,
        });
        return;
      }
      await handleRemoveAdmin({
        adminId: pendingAction.adminId,
        email: pendingAction.email,
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const dialogTitle =
    pendingAction?.type === 'toggle-super'
      ? pendingAction.nextIsSuperAdmin
        ? `Make ${pendingAction.email} a super admin?`
        : `Revoke super admin from ${pendingAction.email}?`
      : pendingAction
        ? `Remove admin account ${pendingAction.email}?`
        : 'Confirm action?';
  const dialogActionLabel =
    pendingAction?.type === 'toggle-super'
      ? pendingAction.nextIsSuperAdmin
        ? 'Make Super'
        : 'Revoke Super'
      : 'Remove';
  const dialogActionVariant =
    pendingAction?.type === 'toggle-super' && pendingAction.nextIsSuperAdmin
      ? 'default'
      : 'destructive';

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
              onToggleSuperAdmin={requestToggleSuperAdmin}
              onRemoveAdmin={requestRemoveAdmin}
            />
            <AdminUsersTable
              adminData={adminData}
              isMutating={isMutating}
              actionButtonBaseClass={actionButtonBaseClass}
              formatCreatedAt={formatCreatedAt}
              onToggleSuperAdmin={requestToggleSuperAdmin}
              onRemoveAdmin={requestRemoveAdmin}
            />
          </>
        ) : (
          <p className='py-8 text-center text-sm'>No admins found.</p>
        )}
      </div>
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          if (!isMutating) {
            setIsConfirmDialogOpen(open);
            if (!open) {
              setPendingAction(null);
            }
          }
        }}
      >
        <AlertDialogContent size='sm'>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              This action will be applied immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={dialogActionVariant}
              disabled={isMutating || !pendingAction}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmAction();
              }}
            >
              {isMutating ? 'Applying...' : dialogActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
            onToggleSuperAdmin({
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
            onRemoveAdmin({
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
