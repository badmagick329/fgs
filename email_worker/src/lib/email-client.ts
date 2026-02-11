import type { EmailData } from '@/types';
import type { Result } from '@/types/result';
import { type EmailConfig } from '@/types/schemas';
import { Resend } from 'resend';
import { EmailTemplate } from '@/lib/email-template';

export class EmailClient {
  private API_KEY: string;
  private SENDER: string;
  private DESTINATION: string;
  constructor(config: EmailConfig) {
    this.API_KEY = config.RESEND_API_KEY;
    this.SENDER = config.SENDER_EMAIL_ADDRESS;
    this.DESTINATION = config.DESTINATION_EMAIL_ADDRESS;
  }

  async sendEmail({
    email_data,
  }: EmailData): Promise<Result<{ providerId: string }, string>> {
    const resend = new Resend(this.API_KEY);
    try {
      const { data, error } = await resend.emails.send({
        from: `Registration Form <${this.SENDER}>`,
        to: `${this.DESTINATION}`,
        subject: 'New Student Registration',
        react: EmailTemplate({
          email_data,
        }),
      });

      if (error) {
        console.error('Resend API Error:', error);
        return { ok: false, error: error.message };
      }
      return { ok: true, data: { providerId: data.id ?? '' } };
    } catch (err) {
      console.error('Unexpected Email Error', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown Error',
      };
    }
  }
}
