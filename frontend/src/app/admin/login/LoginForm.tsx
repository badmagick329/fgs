'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? 'Login failed.');
        return;
      }
      router.replace('/registrations');
    } catch {
      setError('Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='flex min-h-screen items-center justify-center'>
      <form
        className='flex w-full max-w-md flex-col gap-4 rounded-lg bg-gray-800 p-6'
        onSubmit={onSubmit}
      >
        <h1 className='text-2xl font-semibold'>Admin Login</h1>
        <label className='flex flex-col gap-2'>
          <span>Email</span>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='rounded-md border border-gray-300 p-2 text-white'
            required
          />
        </label>
        <label className='flex flex-col gap-2'>
          <span>Password</span>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='rounded-md border border-gray-300 p-2 text-white'
            required
          />
        </label>
        <button
          type='submit'
          className='rounded-md bg-black px-4 py-2 hover:bg-gray-700 disabled:opacity-70'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
        {error && <p className='text-sm text-red-400'>{error}</p>}
      </form>
    </main>
  );
}
