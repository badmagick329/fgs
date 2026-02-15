import type { Notification, Result } from '@/domain';
import {
  type INotificationSender,
  type Logger,
  type LoggerFactory,
} from '@/domain/interfaces';
import { type EmailConfig } from '@/domain/schemas';
import { EmailTemplate } from '@/infrastructure/email/templates/email-template';
import { Resend } from 'resend';

export class EmailClient implements INotificationSender {
  private readonly API_KEY: string;
  private readonly SENDER: string;
  private readonly DESTINATION: string;
  private readonly log: Logger;

  constructor(config: EmailConfig, loggerFactory: LoggerFactory) {
    this.API_KEY = config.resend_api_key;
    this.SENDER = config.sender_email_address;
    this.DESTINATION = config.destination_email_address;
    this.log = loggerFactory('EmailClient');
  }

  async send({ payload }: Notification) {
    const resend = new Resend(this.API_KEY);
    try {
      const { error } = await resend.emails.send({
        from: `Registration Form <${this.SENDER}>`,
        to: `${this.DESTINATION}`,
        subject: 'New Student Registration',
        react: EmailTemplate({
          payload,
        }),
      });

      if (error) {
        this.log.error('Resend API Error:', error);
        return 'fail';
      }
      return 'success';
    } catch (err) {
      this.log.error('Unexpected Email Error', err);
      return 'fail';
    }
  }
}
