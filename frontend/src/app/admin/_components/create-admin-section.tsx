import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createAdminFormSchema = z
  .object({
    email: z.email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

const createAdminResponseSchema = z.object({
  message: z.string().optional(),
});

type CreateAdminFormValues = z.infer<typeof createAdminFormSchema>;

export function CreateAdminSection() {
  const [status, setStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (values: CreateAdminFormValues) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message ?? 'Failed to create admin.');
      }
      const parsed = createAdminResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }
      return parsed.data;
    },
    onSuccess: () => {
      reset();
      setStatus({ tone: 'success', message: 'Admin account created.' });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Failed to create admin.';
      setStatus({ tone: 'error', message });
      setError('root.server', { type: 'server', message });
    },
  });

  const onSubmit = async (values: CreateAdminFormValues) => {
    setStatus(null);
    setError('root.server', { type: 'server', message: '' });
    await createAdminMutation.mutateAsync(values);
  };

  const isDisabled = createAdminMutation.isPending || isSubmitting;

  return (
    <section className='fgs-card'>
      <h3 className='fgs-subheading'>Create Admin</h3>
      <p className='fgs-copy mt-2'>
        Add another admin account with email and password.
      </p>
      <form
        className='mt-6 space-y-4'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Email</span>
          <input
            type='email'
            {...register('email')}
            autoComplete='off'
            aria-invalid={!!errors.email}
            aria-describedby={
              errors.email ? 'create-admin-email-error' : undefined
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='admin@farooqigrammar.school'
          />
        </label>
        {errors.email?.message && (
          <p
            id='create-admin-email-error'
            role='alert'
            className='text-sm text-error'
          >
            {errors.email.message}
          </p>
        )}
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Password</span>
          <input
            type='password'
            {...register('password')}
            autoComplete='off'
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? 'create-admin-password-error' : undefined
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Minimum 8 characters'
          />
        </label>
        {errors.password?.message && (
          <p
            id='create-admin-password-error'
            role='alert'
            className='text-sm text-error'
          >
            {errors.password.message}
          </p>
        )}
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Confirm password</span>
          <input
            type='password'
            {...register('confirmPassword')}
            autoComplete='off'
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword
                ? 'create-admin-confirm-password-error'
                : undefined
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Re-enter password'
          />
        </label>
        {errors.confirmPassword?.message && (
          <p
            id='create-admin-confirm-password-error'
            role='alert'
            className='text-sm text-error'
          >
            {errors.confirmPassword.message}
          </p>
        )}
        <button
          type='submit'
          className='fgs-btn-primary disabled:cursor-not-allowed disabled:opacity-70'
          disabled={isDisabled}
        >
          {isDisabled ? 'Creating...' : 'Create Admin'}
        </button>
        {errors.root?.server?.message && (
          <p role='alert' className='text-sm text-error'>
            {errors.root.server.message}
          </p>
        )}
        {status && (
          <p
            className={
              status.tone === 'error'
                ? 'text-sm text-error'
                : 'text-sm text-fgs-ink'
            }
          >
            {status.message}
          </p>
        )}
      </form>
    </section>
  );
}
