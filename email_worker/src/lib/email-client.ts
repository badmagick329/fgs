'use server';
import type { EmailDataProps } from '@/types';
import type { Result } from '@/types/result';
import { Resend } from 'resend';
import { EmailTemplate } from '@/lib/email-template';
import { env } from './env';
import { getNotificationEmail } from './db';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail({
  email_data,
}: EmailDataProps): Promise<Result<{ providerId: string }, string>> {
  try {
    const config = await getNotificationEmail();
    if (!config?.notification_email) {
      console.error('Missing admin_config.notification_email.');
      return { ok: false, error: 'Notification email not configured.' };
    }
    const { data, error } = await resend.emails.send({
      from: `Registration Form <${env.SENDER_EMAIL_ADDRESS}>`,
      to: `${config.notification_email}`,
      subject: 'New Student Registration',
      react: EmailTemplate({
        email_data,
      }),
    });

    if (error) {
      console.error('Resend API Error:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, data: { providerId: data?.id ?? '' } };
  } catch (err) {
    console.error('Unexpected Email Error', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown Error',
    };
  }
}
