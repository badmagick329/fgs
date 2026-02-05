'use server';
import type { EmailDataProps } from '@/types';
import type { ErrorRecord, Result } from '@/types/result';
import { Resend } from 'resend';
import { EmailTemplate } from '@/lib/email-template';

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER = process.env.SENDER_EMAIL_ADDRESS || 'no-replay@example.com';
const DEST = process.env.DESTINATION_EMAIL_ADDRESS;

export async function sendEmail({
  email_data,
}: EmailDataProps): Promise<Result<{ providerId: string }>> {
  if (!DEST) return { ok: false, error: 'no destination email configured' };
  try {
    const { data, error } = await resend.emails.send({
      from: `Registration Form <${SENDER}>`,
      to: `${DEST}`,
      subject: 'New Student Registration',
      react: EmailTemplate({
        email_data,
      }),
    });

    console.info('Resend response', { data, error });

    if (error) {
      return { ok: false, error: String(error) };
    }
    return { ok: true, data: { providerId: data?.id ?? '' } };
  } catch (err) {
    console.error('Resend error', err);
    const e = err as Error;
    const record: ErrorRecord = {
      message: e.message ?? 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined,
    };
    return { ok: false, errors: [record] };
  }
}
