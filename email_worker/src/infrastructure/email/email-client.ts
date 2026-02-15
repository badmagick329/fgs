import type { Notification } from '@/domain/interfaces';
import {
  type INotificationSender,
  type Logger,
  type LoggerFactory,
  type NotificationResult,
} from '@/domain/interfaces';
import { type EmailConfig } from '@/domain/schemas';
import { DB } from '@/infrastructure/db/db';
import { EmailTemplate } from '@/infrastructure/email/templates/email-template';
import { Resend } from 'resend';

type DbClient = InstanceType<typeof DB>;
type NotificationEmailData = ReturnType<DbClient['getNotificationEmail']>;

export class EmailClient implements INotificationSender {
  private readonly API_KEY: string;
  private readonly SENDER: string;
  private readonly getDestinationEmailAddress: () => NotificationEmailData;
  private readonly log: Logger;

  constructor(
    config: EmailConfig & {
      getDestinationEmailAddress: () => NotificationEmailData;
    },
    loggerFactory: LoggerFactory
  ) {
    this.API_KEY = config.resend_api_key;
    this.SENDER = config.sender_email_address;
    this.getDestinationEmailAddress = config.getDestinationEmailAddress;
    this.log = loggerFactory('EmailClient');
  }

  async send({ payload }: Notification): Promise<NotificationResult> {
    const destination = (await this.getDestinationEmailAddress())
      ?.notification_email;

    if (!destination) {
      this.log.error('Missing destination email address');
      return 'missing_email';
    }

    const resend = new Resend(this.API_KEY);
    try {
      const { error } = await resend.emails.send({
        from: `Registration Form <${this.SENDER}>`,
        to: `${destination}`,
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
