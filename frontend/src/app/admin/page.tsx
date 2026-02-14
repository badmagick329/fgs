'use client';

import { ROUTES } from '@/lib/consts';
import { AdminActions } from './_components/admin-actions';
import { AdminBackdrop } from './_components/admin-backdrop';
import { AdminHeader } from './_components/admin-header';
import { AdminLogoWatermark } from './_components/admin-logo-watermark';
import { AdminUsersSection } from './_components/admin-users-section';
import { ChangePasswordSection } from './_components/change-password-section';
import { CreateAdminSection } from './_components/create-admin-section';
import { NotificationEmailSection } from './_components/notification-email-section';

export default function AdminToolsPage() {
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
          <CreateAdminSection />
          <ChangePasswordSection />
        </div>

        <AdminLogoWatermark />
      </div>
    </main>
  );
}
