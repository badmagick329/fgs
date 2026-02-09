import { countAdmins } from '@/lib/serveronly/auth';
import { redirect } from 'next/navigation';
import SetupForm from './SetupForm';

export default async function AdminSetupPage() {
  const adminCount = await countAdmins();
  if (adminCount > 0) {
    redirect('/admin/login');
  }

  return <SetupForm />;
}
