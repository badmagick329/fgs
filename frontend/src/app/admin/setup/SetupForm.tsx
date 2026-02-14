'use client';

import { API, ROUTES } from '@/lib/consts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SetupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(API.admin.setup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? 'Setup failed.');
        return;
      }
      router.replace(ROUTES.registrations);
    } catch {
      setError('Setup failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-10'>
      <form
        className='w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8'
        onSubmit={onSubmit}
      >
        <h1 className='text-3xl font-semibold leading-tight'>
          Create Admin Account
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Initial setup only. This creates the first admin user for
          registrations.
        </p>

        <label className='mt-6 flex flex-col gap-2'>
          <span className='text-sm font-medium'>Email</span>
          <input
            type='email'
            value={email}
            autoComplete='off'
            onChange={(e) => setEmail(e.target.value)}
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='admin@farooqigrammar.school'
            required
          />
        </label>
        <label className='mt-4 flex flex-col gap-2'>
          <span className='text-sm font-medium'>Password</span>
          <input
            type='password'
            value={password}
            autoComplete='off'
            onChange={(e) => setPassword(e.target.value)}
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Minimum 8 characters'
            required
            minLength={8}
          />
        </label>
        <button
          type='submit'
          className='fgs-btn-primary mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Admin'}
        </button>
        {error && <p className='mt-3 text-sm text-error'>{error}</p>}
      </form>
    </main>
  );
}
