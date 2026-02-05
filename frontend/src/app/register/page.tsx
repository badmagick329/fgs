'use client';
import {
  type CreateRegistration,
  type Registration,
  createRegistrationSchema,
} from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Result } from '@/lib/result';

export default function RegisterPage() {
  const [status, setStatus] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRegistration>({
    resolver: zodResolver(createRegistrationSchema),
    defaultValues: { firstName: '', lastName: '', email: '' },
  });

  const registerMutation = useMutation({
    mutationFn: async (values: CreateRegistration) => {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      return (await res.json()) as Result<Registration>;
    },
  });

  async function onSubmit(values: CreateRegistration) {
    setStatus(null);
    try {
      const json = await registerMutation.mutateAsync(values);
      if (json.ok) {
        setStatus('Registered!');
        reset();
        return;
      }

      setStatus(json.message ?? 'An unexpected error occurred.');
      if (Array.isArray(json.errors)) {
        json.errors.forEach((err: { field?: string; message: string }) => {
          if (!err.field) return;
          setError(err.field as keyof CreateRegistration, {
            type: 'server',
            message: err.message,
          });
        });
      } else {
        setError('root.server', {
          type: 'server',
          message: json.message ?? 'An unexpected error occurred.',
        });
      }
    } catch {
      const message = 'An unexpected error occurred. Please try again later.';
      setStatus(message);
      setError('root.server', { type: 'server', message });
    }
  }

  return (
    <main className='flex flex-col min-h-screen'>
      <div className='flex flex-col items-center gap-8'>
        <h1 className='text-4xl font-semibold'>Register</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='flex flex-col items-center'>
            <div className='flex flex-col mb-4'>
              <label htmlFor='firstName' className='mb-2'>
                First Name
              </label>
              <input
                type='text'
                id='firstName'
                autoComplete='off'
                {...register('firstName')}
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? 'firstName-error' : undefined
                }
                className='rounded-md border border-gray-300 p-2 w-md'
              />
              {errors.firstName?.message && (
                <p
                  id='firstName-error'
                  role='alert'
                  className='mt-1 text-sm text-red-600'
                >
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className='flex flex-col mb-4'>
              <label htmlFor='lastName' className='mb-2'>
                Last Name
              </label>
              <input
                type='text'
                id='lastName'
                autoComplete='off'
                {...register('lastName')}
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? 'lastName-error' : undefined
                }
                className='rounded-md border border-gray-300 p-2 w-md'
              />
              {errors.lastName?.message && (
                <p
                  id='lastName-error'
                  role='alert'
                  className='mt-1 text-sm text-red-600'
                >
                  {errors.lastName.message}
                </p>
              )}
            </div>
            <div className='flex flex-col mb-4'>
              <label htmlFor='email' className='mb-2'>
                Email
              </label>
              <input
                type='email'
                id='email'
                autoComplete='off'
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className='rounded-md border border-gray-300 p-2 w-md'
              />
              {errors.email?.message && (
                <p
                  id='email-error'
                  role='alert'
                  className='mt-1 text-sm text-red-600'
                >
                  {errors.email.message}
                </p>
              )}
            </div>
            <button
              className='mt-4 rounded-md bg-black px-4 py-2 hover:bg-gray-800 hover:cursor-pointer w-32 disabled:cursor-wait'
              type='submit'
              disabled={isSubmitting || registerMutation.isPending}
            >
              Register
            </button>
            {errors.root?.server?.message && (
              <p role='alert' className='mt-3 text-sm text-red-600'>
                {errors.root.server.message}
              </p>
            )}
            {status && <p className='mt-3'>{status}</p>}
          </div>
        </form>
      </div>
    </main>
  );
}
