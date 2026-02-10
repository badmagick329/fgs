'use server';
import type { EmailDataProps } from '@/types';
import type { Result } from '@/types/result';
import { Resend } from 'resend';
import { EmailTemplate } from '@/lib/email-template';
import { env } from './env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail({
  email_data,
}: EmailDataProps): Promise<Result<{ providerId: string }, string>> {
  try {
    const { data, error } = await resend.emails.send({
      from: `Registration Form <${env.SENDER_EMAIL_ADDRESS}>`,
      to: `${env.DESTINATION_EMAIL_ADDRESS}`,
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
