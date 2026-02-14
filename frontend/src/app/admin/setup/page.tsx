import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/consts';
import { getServerContainer } from '@/lib/serveronly/container';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';

export default async function AdminSetupPage() {
  const { adminManagementService } = getServerContainer();
  const adminCount = await adminManagementService.countAdmins();
  if (adminCount > 0) {
    redirect(ROUTES.admin.login);
  }

  return <SetupForm />;
}



