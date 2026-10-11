import {
  type AdminConfig,
  getAdminConfig,
  saveAdminConfig,
  setRegistrationDiscordNotifications,
} from '@/features/admin/presentation/admin-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { QUERY_KEYS } from '@/lib/consts';

const notificationEmailFormSchema = z.object({
  notificationEmail: z.email('Enter a valid email address.'),
});

type NotificationEmailFormValues = z.infer<typeof notificationEmailFormSchema>;

export function NotificationEmailSection() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationEmailFormValues>({
    resolver: zodResolver(notificationEmailFormSchema),
    defaultValues: {
      notificationEmail: '',
    },
  });

  const configQuery = useQuery({
    queryKey: QUERY_KEYS.adminConfig,
    queryFn: getAdminConfig,
  });

  const saveConfigMutation = useMutation({
    mutationFn: saveAdminConfig,
    onSuccess: (config) => {
      setStatus({ tone: 'success', message: 'Saved notification email.' });
      queryClient.setQueryData<AdminConfig>(QUERY_KEYS.adminConfig, config);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Update failed.';
      setError('root.server', { type: 'server', message });
    },
  });

  const registrationDiscordMutation = useMutation({
    mutationFn: setRegistrationDiscordNotifications,
    onSuccess: (config) => {
      setStatus({
        tone: 'success',
        message: 'Saved Discord notification setting.',
      });
      queryClient.setQueryData<AdminConfig>(QUERY_KEYS.adminConfig, config);
    },
    onError: (error) => {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Update failed.',
      });
    },
  });

  useEffect(() => {
    const email = configQuery.data?.notification_email ?? '';
    reset({ notificationEmail: email });
  }, [configQuery.data?.notification_email, reset]);

  const onSubmit = async (values: NotificationEmailFormValues) => {
    setStatus(null);
    setError('root.server', { type: 'server', message: '' });
    await saveConfigMutation.mutateAsync(values);
  };

  const isDisabled = saveConfigMutation.isPending || isSubmitting;

  return (
    <>
      <form
        className='max-w-lg space-y-3'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className='flex flex-col gap-2'>
          <label htmlFor='notification-email' className='text-sm font-semibold'>
            Email address
          </label>
          <p
            id='notification-email-hint'
            className='text-sm text-muted-foreground'
          >
            Each new registration is emailed here.
          </p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <input
              id='notification-email'
              type='email'
              {...register('notificationEmail')}
              autoComplete='off'
              aria-invalid={!!errors.notificationEmail}
              aria-describedby={
                errors.notificationEmail
                  ? 'notification-email-hint notification-email-error'
                  : 'notification-email-hint'
              }
              className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
              placeholder='office@example.com'
            />
            <button
              type='submit'
              className='fgs-btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-70'
              disabled={isDisabled}
            >
              {isDisabled ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        {errors.notificationEmail?.message && (
          <p
            id='notification-email-error'
            role='alert'
            className='text-sm text-error'
          >
            {errors.notificationEmail.message}
          </p>
        )}
        {errors.root?.server?.message && (
          <p role='alert' className='text-sm text-error'>
            {errors.root.server.message}
          </p>
        )}
        {status && status.tone === 'success' && (
          <p className='text-sm text-fgs-ink'>{status.message}</p>
        )}
        {configQuery.isError && (
          <p className='text-sm text-error'>
            Failed to load current notification email.
          </p>
        )}
        {configQuery.data?.updated_at && configQuery.data?.updated_by_email && (
          <p className='text-sm text-muted-foreground'>
            Last changed{' '}
            {new Date(configQuery.data.updated_at).toLocaleString()} by{' '}
            {configQuery.data.updated_by_email}
          </p>
        )}
      </form>

      <div className='max-w-lg'>
        <label className='flex items-start gap-3'>
          <input
            type='checkbox'
            checked={
              configQuery.data?.registration_discord_notifications_enabled ??
              false
            }
            disabled={
              !configQuery.data || registrationDiscordMutation.isPending
            }
            onChange={(event) => {
              setStatus(null);
              registrationDiscordMutation.mutate(event.target.checked);
            }}
            className='mt-0.5 size-4 shrink-0 accent-fgs-blue disabled:cursor-not-allowed'
          />
          <span className='flex flex-col gap-1'>
            <span className='text-sm font-semibold'>Also post to Discord</span>
            <span className='text-sm text-muted-foreground'>
              For testing. The message leaves out personal details.
            </span>
          </span>
        </label>
        {!configQuery.data && !configQuery.isLoading && (
          <p className='mt-2 text-sm text-muted-foreground'>
            Save an email address before turning this on.
          </p>
        )}
        {status?.tone === 'error' && (
          <p role='alert' className='mt-2 text-sm text-error'>
            {status.message}
          </p>
        )}
      </div>
    </>
  );
}
