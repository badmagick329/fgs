import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { API, QUERY_KEYS } from '@/lib/consts';

type AdminConfig = {
  id: number;
  notification_email: string;
  registration_discord_notifications_enabled: boolean;
  updated_by_admin_user_id: number;
  updated_at: string;
  updated_by_email: string;
} | null;

const notificationEmailFormSchema = z.object({
  notificationEmail: z.email('Enter a valid email address.'),
});

const adminConfigSchema = z
  .object({
    id: z.number(),
    notification_email: z.string().email(),
    registration_discord_notifications_enabled: z.boolean(),
    updated_by_admin_user_id: z.number(),
    updated_at: z.string(),
    updated_by_email: z.string(),
  })
  .nullable();

const adminConfigResponseSchema = z.object({
  data: adminConfigSchema,
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
    queryFn: async (): Promise<AdminConfig> => {
      const res = await fetch(API.admin.config);
      if (!res.ok) {
        throw new Error('Failed to load config.');
      }
      const json = await res.json().catch(() => null);
      const parsed = adminConfigResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }
      return parsed.data.data;
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async ({
      notificationEmail,
    }: NotificationEmailFormValues): Promise<AdminConfig> => {
      const res = await fetch(API.admin.config, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationEmail }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message ?? 'Update failed.');
      }
      const parsed = adminConfigResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }
      return parsed.data.data;
    },
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
    mutationFn: async (enabled: boolean): Promise<AdminConfig> => {
      const res = await fetch(API.admin.config, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationDiscordNotificationsEnabled: enabled }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message ?? 'Update failed.');
      }
      const parsed = adminConfigResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error('Invalid response from server.');
      }
      return parsed.data.data;
    },
    onSuccess: (config) => {
      setStatus({ tone: 'success', message: 'Saved Discord notification setting.' });
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
    <section className='fgs-card lg:col-span-2'>
      <h3 className='fgs-subheading'>Notification Email</h3>
      <p className='fgs-copy mt-2'>
        Set the destination email for new registration notifications.
      </p>
      <form
        className='mt-6 space-y-4'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Destination email</span>
          <input
            type='email'
            {...register('notificationEmail')}
            autoComplete='off'
            aria-invalid={!!errors.notificationEmail}
            aria-describedby={
              errors.notificationEmail ? 'notification-email-error' : undefined
            }
            className='w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
            placeholder='youremail@email.com'
          />
        </label>
        {errors.notificationEmail?.message && (
          <p
            id='notification-email-error'
            role='alert'
            className='text-sm text-error'
          >
            {errors.notificationEmail.message}
          </p>
        )}
        <button
          type='submit'
          className='fgs-btn-primary disabled:cursor-not-allowed disabled:opacity-70'
          disabled={isDisabled}
        >
          {isDisabled ? 'Saving...' : 'Save'}
        </button>
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
            Last updated{' '}
            {new Date(configQuery.data.updated_at).toLocaleString()} by{' '}
            {configQuery.data.updated_by_email}
          </p>
        )}
      </form>

      <div className='mt-8 border-t border-border pt-6'>
        <h4 className='text-base font-semibold'>Discord registration notifications</h4>
        <p className='fgs-copy mt-2'>
          Send a testing notification to Discord when a registration is created.
          Personal details are not included.
        </p>
        <label className='mt-4 flex items-center gap-3 text-sm font-medium'>
          <input
            type='checkbox'
            checked={
              configQuery.data?.registration_discord_notifications_enabled ?? false
            }
            disabled={!configQuery.data || registrationDiscordMutation.isPending}
            onChange={(event) => {
              setStatus(null);
              registrationDiscordMutation.mutate(event.target.checked);
            }}
            className='size-4 accent-fgs-blue disabled:cursor-not-allowed'
          />
          Enable testing notifications
        </label>
        {!configQuery.data && !configQuery.isLoading && (
          <p className='mt-2 text-sm text-muted-foreground'>
            Save a notification email before enabling this setting.
          </p>
        )}
        {status?.tone === 'error' && (
          <p role='alert' className='mt-2 text-sm text-error'>
            {status.message}
          </p>
        )}
      </div>
    </section>
  );
}
