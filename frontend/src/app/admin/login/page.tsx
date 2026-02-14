import { redirect } from 'next/navigation';
import { getServerContainer } from '@/lib/serveronly/container';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const { adminManagementService } = getServerContainer();
  const adminCount = await adminManagementService.countAdmins();
  if (adminCount === 0) {
    redirect('/admin/setup');
  }

  return <LoginForm />;
}



