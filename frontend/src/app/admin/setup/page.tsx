import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ROUTES } from '@/lib/consts';
import { getServerContainer } from '@/lib/server/container';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Setup',
};

export default async function AdminSetupPage() {
  const { adminAccessService, adminManagementService } = getServerContainer();
  const adminCount = await adminManagementService.countAdmins();
  if (adminCount > 0) {
    redirect(ROUTES.admin.login);
  }
  // Matches the API: no ADMIN_SETUP_TOKEN, no setup.
  if (!adminAccessService.isSetupEnabled()) {
    notFound();
  }

  return <SetupForm />;
}
