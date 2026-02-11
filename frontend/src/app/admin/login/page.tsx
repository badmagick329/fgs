import { countAdmins } from '@/lib/serveronly/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function AdminLoginPage() {
  const adminCount = await countAdmins();
  if (adminCount === 0) {
    redirect('/admin/setup');
  }

  return <LoginForm />;
}
