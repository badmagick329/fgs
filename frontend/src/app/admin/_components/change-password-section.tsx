import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { API, ROUTES } from '@/lib/consts';

const changePasswordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Current password must be at least 8 characters.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must be at least 8 characters.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
  });

const changePasswordResponseSchema = z.object({
  message: z.string().optional(),
});

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export function ChangePasswordSection() {
  const router = useRouter();
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
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordFormValues) => {
      const res = await fetch(API.admin.password, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message ?? 'Password update failed.');
      }
      const parsed = changePasswordResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }
      return parsed.data;
    },
    onSuccess: () => {
      reset();
      setStatus({
        tone: 'success',
        message: 'Password updated. Redirecting to sign in...',
      });
      router.replace(ROUTES.admin.login);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Password update failed.';
      setStatus({ tone: 'error', message });
      setError('root.server', { type: 'server', message });
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setStatus(null);
    setError('root.server', { type: 'server', message: '' });
    await updatePasswordMutation.mutateAsync(values);
  };

  const isDisabled = updatePasswordMutation.isPending || isSubmitting;

  return (
    <section className='fgs-card'>
      <h3 className='fgs-subheading'>Change Password</h3>
      <p className='fgs-copy mt-2'>
        Update your password. You will need to sign in again.
      </p>
      <form
        className='mt-6 space-y-4'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Current password</span>
          <input
            type='password'
            {...register('currentPassword')}
            autoComplete='off'
            aria-invalid={!!errors.currentPassword}
            aria-describedby={
              errors.currentPassword
                ? 'change-password-current-error'
                : undefined
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Enter current password'
          />
        </label>
        {errors.currentPassword?.message && (
          <p
            id='change-password-current-error'
            role='alert'
            className='text-sm text-error'
          >
            {errors.currentPassword.message}
          </p>
        )}
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>New password</span>
          <input
            type='password'
            {...register('newPassword')}
            autoComplete='off'
            aria-invalid={!!errors.newPassword}
            aria-describedby={
              errors.newPassword ? 'change-password-new-error' : undefined
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Minimum 8 characters'
          />
        </label>
        {errors.newPassword?.message && (
          <p
            id='change-password-new-error'
            role='alert'
            className='text-sm text-error'
          >
            {errors.newPassword.message}
          </p>
        )}
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Confirm new password</span>
          <input
            type='password'
            {...register('confirmPassword')}
            autoComplete='off'
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword
                ? 'change-password-confirm-error'
                : undefined
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='Re-enter new password'
          />
        </label>
        {errors.confirmPassword?.message && (
          <p
            id='change-password-confirm-error'
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
          {isDisabled ? 'Updating...' : 'Update Password'}
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
