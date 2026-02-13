'use client';

import {
  type CreateRegistration,
  createRegistrationSchema,
  registrationResultSchema,
} from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function AdmissionInterestForm() {
  const [status, setStatus] = useState<{
    tone: 'success';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateRegistration>({
    resolver: zodResolver(createRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const submitInterest = useMutation({
    mutationFn: async (values: CreateRegistration) => {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const payload = await res.json();
      const parsed = registrationResultSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }

      return parsed.data;
    },
  });

  async function onSubmit(values: CreateRegistration) {
    setStatus(null);
    setError('root.server', { type: 'server', message: '' });
    try {
      const result = await submitInterest.mutateAsync(values);
      if (result.ok) {
        reset();
        setStatus({
          tone: 'success',
          message:
            'Interest registered. Our admissions team will contact you soon.',
        });
        return;
      }

      if (Array.isArray(result.errors)) {
        result.errors.forEach((error) => {
          if (!error.field) return;
          setError(error.field as keyof CreateRegistration, {
            type: 'server',
            message: error.message,
          });
        });
      } else {
        setError('root.server', {
          type: 'server',
          message: result.message,
        });
      }
    } catch {
      const message = 'Unable to submit right now. Please try again shortly.';
      setError('root.server', { type: 'server', message });
    }
  }

  const isDisabled = submitInterest.isPending || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='rounded-2xl border border-border bg-card p-5 sm:p-6'
      noValidate
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='sm:col-span-1'>
          <label
            htmlFor='firstName'
            className='text-fgs-ink text-sm font-medium'
          >
            Student First Name
          </label>
          <input
            id='firstName'
            type='text'
            autoComplete='given-name'
            {...register('firstName')}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            className='mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder="Student's First Name"
          />
          {errors.firstName?.message && (
            <p
              id='firstName-error'
              role='alert'
              className='mt-1.5 text-xs text-error'
            >
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className='sm:col-span-1'>
          <label
            htmlFor='lastName'
            className='text-fgs-ink text-sm font-medium'
          >
            Student Last Name
          </label>
          <input
            id='lastName'
            type='text'
            autoComplete='family-name'
            {...register('lastName')}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            className='mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder="Student's Last Name"
          />
          {errors.lastName?.message && (
            <p
              id='lastName-error'
              role='alert'
              className='mt-1.5 text-xs text-error'
            >
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className='mt-4'>
        <label htmlFor='email' className='text-fgs-ink text-sm font-medium'>
          Parent Email
        </label>
        <input
          id='email'
          type='email'
          autoComplete='email'
          {...register('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className='mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
          placeholder='parent@example.com'
        />
        {errors.email?.message && (
          <p
            id='email-error'
            role='alert'
            className='mt-1.5 text-xs text-error'
          >
            {errors.email.message}
          </p>
        )}
      </div>

      <p className='mt-4 text-xs text-muted-foreground'>
        This registers admission interest only and does not confirm enrollment.
      </p>

      <button
        type='submit'
        disabled={isDisabled}
        className='fgs-btn-primary mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto'
      >
        {isDisabled ? 'Submitting...' : 'Register Interest'}
      </button>

      {errors.root?.server?.message && (
        <p role='alert' className='mt-3 text-xs text-error'>
          {errors.root.server.message}
        </p>
      )}

      {status && (
        <p
          role='status'
          className='mt-3 text-xs text-emerald-700'
        >
          {status.message}
        </p>
      )}
    </form>
  );
}
