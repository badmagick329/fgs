'use client';

import { ROUTES } from '@/lib/consts';
import { useAdminUsersList } from '@/hooks/useAdminUsersList';
import { AdminActions } from './_components/AdminActions';
import { AdminBackdrop } from './_components/AdminBackdrop';
import { AdminHeader } from './_components/AdminHeader';
import { AdminLogoWatermark } from './_components/AdminLogoWatermark';
import { AdminUsersSection } from './_components/AdminUsersSection';
import { ChangePasswordSection } from './_components/ChangePasswordSection';
import { CreateAdminSection } from './_components/CreateAdminSection';
import { NotificationEmailSection } from './_components/NotificationEmailSection';

export default function AdminToolsPage() {
  const adminUsersQuery = useAdminUsersList();
  const canCreateAdmins = adminUsersQuery.data?.currentAdminIsSuperAdmin ?? false;

  return (
    <main className='bg-background text-foreground relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8'>
        <AdminBackdrop />
      <div className='relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col'>
        <AdminHeader />
        <AdminActions
          navigationHref={ROUTES.registrations}
          navigationLabel='Back to registrations'
        />

        <div className='mt-8 grid gap-6 lg:grid-cols-2'>
          <NotificationEmailSection />
          <AdminUsersSection />
          {canCreateAdmins ? <CreateAdminSection /> : null}
          <ChangePasswordSection />
        </div>

        <AdminLogoWatermark />
      </div>
    </main>
  );
}
