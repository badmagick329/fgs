import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { API, QUERY_KEYS } from '@/lib/consts';

type AdminConfig = {
  id: number;
  notification_email: string;
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
      setStatus({ tone: 'error', message });
      setError('root.server', { type: 'server', message });
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
    </section>
  );
}
