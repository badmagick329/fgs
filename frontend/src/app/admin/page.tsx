'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type FormState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string | null;
};

type AdminConfig = {
  id: number;
  notification_email: string;
  updated_by_admin_user_id: number;
  updated_at: string;
  updated_by_email: string;
} | null;

const initialFormState: FormState = { status: 'idle', message: null };

export default function AdminToolsPage() {
  const router = useRouter();
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createState, setCreateState] = useState<FormState>(initialFormState);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeState, setChangeState] = useState<FormState>(initialFormState);

  const [notificationEmail, setNotificationEmail] = useState('');
  const [configState, setConfigState] = useState<FormState>(initialFormState);
  const [config, setConfig] = useState<AdminConfig>(null);

  const backdrop = (
    <>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgb(0_160_224/0.16),transparent_28%),radial-gradient(circle_at_12%_82%,rgb(240_176_32/0.14),transparent_30%)]'
      />
    </>
  );

  const logoWatermark = (
    <div aria-hidden className='mt-auto flex justify-center pt-12 md:justify-end'>
      <Image
        src='/fgs-logo.png'
        alt=''
        width={720}
        height={720}
        className='h-auto w-48 opacity-[0.12] blur-[0.65px] sm:w-64 md:w-80 lg:w-104'
      />
    </div>
  );

  const handleCreateAdmin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setCreateState({ status: 'submitting', message: null });
    try {
      const res = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createEmail, password: createPassword }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setCreateState({
          status: 'error',
          message: json?.message ?? 'Failed to create admin.',
        });
        return;
      }
      setCreateState({
        status: 'success',
        message: 'Admin account created.',
      });
      setCreateEmail('');
      setCreatePassword('');
    } catch {
      setCreateState({ status: 'error', message: 'Failed to create admin.' });
    }
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setChangeState({
        status: 'error',
        message: 'New passwords do not match.',
      });
      return;
    }
    setChangeState({ status: 'submitting', message: null });
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setChangeState({
          status: 'error',
          message: json?.message ?? 'Password update failed.',
        });
        return;
      }
      setChangeState({
        status: 'success',
        message: 'Password updated. Redirecting to sign in...',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.setTimeout(() => {
        router.replace('/admin/login');
      }, 900);
    } catch {
      setChangeState({ status: 'error', message: 'Password update failed.' });
    }
  };

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const data = json?.data ?? null;
      if (data?.notification_email) {
        setNotificationEmail(data.notification_email);
      }
      setConfig(data);
    } catch {
      // ignore
    }
  };

  const handleUpdateConfig = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setConfigState({ status: 'submitting', message: null });
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationEmail }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setConfigState({
          status: 'error',
          message: json?.message ?? 'Update failed.',
        });
        return;
      }
      setConfigState({ status: 'success', message: 'Saved notification email.' });
      setConfig(json?.data ?? null);
    } catch {
      setConfigState({ status: 'error', message: 'Update failed.' });
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <main className='bg-background text-foreground relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8'>
      {backdrop}
      <div className='relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col'>
        <div>
          <h2 className='fgs-heading'>Admin Tools</h2>
          <p className='fgs-copy mt-2'>Manage admin access and your account.</p>
        </div>

        <div className='mt-4 flex flex-wrap gap-3'>
          <button
            type='button'
            className='fgs-btn-secondary'
            onClick={() => router.replace('/registrations')}
          >
            Back to registrations
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              (async () => {
                const res = await fetch('/api/admin/logout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) {
                  console.error('Logout failed.');
                } else {
                  router.replace('/admin/login');
                }
              })();
            }}
          >
            <button type='submit' className='fgs-btn-danger'>
              Logout
            </button>
          </form>
        </div>

        <div className='mt-8 grid gap-6 lg:grid-cols-2'>
          <section className='fgs-card lg:col-span-2'>
            <h3 className='fgs-subheading'>Notification Email</h3>
            <p className='fgs-copy mt-2'>
              Set the destination email for new registration notifications.
            </p>
            <form className='mt-6 space-y-4' onSubmit={handleUpdateConfig}>
              <label className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Destination email</span>
                <input
                  type='email'
                  value={notificationEmail}
                  autoComplete='off'
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
                  placeholder='admissions@farooqigrammar.school'
                  required
                />
              </label>
              <button
                type='submit'
                className='fgs-btn-primary disabled:cursor-not-allowed disabled:opacity-70'
                disabled={configState.status === 'submitting'}
              >
                {configState.status === 'submitting' ? 'Saving...' : 'Save'}
              </button>
              {configState.message && (
                <p
                  className={
                    configState.status === 'error'
                      ? 'text-sm text-error'
                      : 'text-sm text-fgs-ink'
                  }
                >
                  {configState.message}
                </p>
              )}
              {config?.updated_at && config?.updated_by_email && (
                <p className='text-sm text-muted-foreground'>
                  Last updated {new Date(config.updated_at).toLocaleString()} by{' '}
                  {config.updated_by_email}
                </p>
              )}
            </form>
          </section>
          <section className='fgs-card'>
            <h3 className='fgs-subheading'>Create Admin</h3>
            <p className='fgs-copy mt-2'>
              Add another admin account with email and password.
            </p>
            <form className='mt-6 space-y-4' onSubmit={handleCreateAdmin}>
              <label className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Email</span>
                <input
                  type='email'
                  value={createEmail}
                  autoComplete='off'
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
                  placeholder='admin@farooqigrammar.school'
                  required
                />
              </label>
              <label className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Password</span>
                <input
                  type='password'
                  value={createPassword}
                  autoComplete='off'
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
                  placeholder='Minimum 8 characters'
                  minLength={8}
                  required
                />
              </label>
              <button
                type='submit'
                className='fgs-btn-primary disabled:cursor-not-allowed disabled:opacity-70'
                disabled={createState.status === 'submitting'}
              >
                {createState.status === 'submitting'
                  ? 'Creating...'
                  : 'Create Admin'}
              </button>
              {createState.message && (
                <p
                  className={
                    createState.status === 'error'
                      ? 'text-sm text-error'
                      : 'text-sm text-fgs-ink'
                  }
                >
                  {createState.message}
                </p>
              )}
            </form>
          </section>

          <section className='fgs-card'>
            <h3 className='fgs-subheading'>Change Password</h3>
            <p className='fgs-copy mt-2'>
              Update your password. You will need to sign in again.
            </p>
            <form className='mt-6 space-y-4' onSubmit={handleChangePassword}>
              <label className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Current password</span>
                <input
                  type='password'
                  value={currentPassword}
                  autoComplete='off'
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
                  placeholder='Enter current password'
                  minLength={8}
                  required
                />
              </label>
              <label className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>New password</span>
                <input
                  type='password'
                  value={newPassword}
                  autoComplete='off'
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
                  placeholder='Minimum 8 characters'
                  minLength={8}
                  required
                />
              </label>
              <label className='flex flex-col gap-2'>
                <span className='text-sm font-medium'>Confirm new password</span>
                <input
                  type='password'
                  value={confirmPassword}
                  autoComplete='off'
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
                  placeholder='Re-enter new password'
                  minLength={8}
                  required
                />
              </label>
              <button
                type='submit'
                className='fgs-btn-primary disabled:cursor-not-allowed disabled:opacity-70'
                disabled={changeState.status === 'submitting'}
              >
                {changeState.status === 'submitting'
                  ? 'Updating...'
                  : 'Update Password'}
              </button>
              {changeState.message && (
                <p
                  className={
                    changeState.status === 'error'
                      ? 'text-sm text-error'
                      : 'text-sm text-fgs-ink'
                  }
                >
                  {changeState.message}
                </p>
              )}
            </form>
          </section>
        </div>

        {logoWatermark}
      </div>
    </main>
  );
}
