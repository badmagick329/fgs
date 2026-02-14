import { redirect } from 'next/navigation';
import { countAdmins } from '@/lib/serveronly/db';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';

export default async function AdminSetupPage() {
  const adminCount = await countAdmins();
  if (adminCount > 0) {
    redirect('/admin/login');
  }

  return <SetupForm />;
}
