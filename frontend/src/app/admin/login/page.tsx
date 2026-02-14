import { redirect } from 'next/navigation';
import { countAdmins } from '@/lib/serveronly/db';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const adminCount = await countAdmins();
  if (adminCount === 0) {
    redirect('/admin/setup');
  }

  return <LoginForm />;
}
