'use client';

import { useAdminUsersList } from '@/features/admin/presentation/useAdminUsersList';
import { AdminBackdrop } from './_components/AdminBackdrop';
import { AdminLogoWatermark } from './_components/AdminLogoWatermark';
import { AdminNav } from './_components/AdminNav';
import { AdminUsersSection } from './_components/AdminUsersSection';
import { ChangePasswordSection } from './_components/ChangePasswordSection';
import { CreateAdminSection } from './_components/CreateAdminSection';
import { NotificationEmailSection } from './_components/NotificationEmailSection';
import { SettingsGroup } from './_components/SettingsGroup';

export default function AdminSettingsPage() {
  const adminUsersQuery = useAdminUsersList();
  const canCreateAdmins =
    adminUsersQuery.data?.currentAdminIsSuperAdmin ?? false;

  return (
    <main className='bg-background text-foreground relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8'>
      <AdminBackdrop />
      <div className='relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col'>
        <AdminNav />
        <h1 className='fgs-heading'>Settings</h1>
        <p className='fgs-copy mt-2 mb-8'>
          How the school hears about new registrations, and who can use these
          admin pages.
        </p>

        <SettingsGroup
          title='Registration alerts'
          description='Where a new admission registration is announced as soon as it comes in.'
        >
          <NotificationEmailSection />
        </SettingsGroup>

        <SettingsGroup
          title='Admins'
          description='Everyone who can sign in here. Super admins can add, promote and remove admins.'
        >
          <AdminUsersSection />
          {canCreateAdmins ? <CreateAdminSection /> : null}
        </SettingsGroup>

        <SettingsGroup
          title='Your password'
          description='Change the password you sign in with. You will be signed out and asked to sign in again.'
        >
          <ChangePasswordSection />
        </SettingsGroup>

        <AdminLogoWatermark />
      </div>
    </main>
  );
}
