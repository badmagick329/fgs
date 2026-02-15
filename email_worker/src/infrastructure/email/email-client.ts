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
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly getNotificationEmailData: () => NotificationEmailData;
  private readonly log: Logger;

  constructor(
    config: EmailConfig & {
      getNotificationEmailData: () => NotificationEmailData;
    },
    loggerFactory: LoggerFactory
  ) {
    this.apiKey = config.resendApiKey;
    this.sender = config.senderEmailAddress;
    this.getNotificationEmailData = config.getNotificationEmailData;
    this.log = loggerFactory('EmailClient');
  }

  async send({ payload }: Notification): Promise<NotificationResult> {
    const notificationEmailAddress = (await this.getNotificationEmailData())
      ?.notification_email;

    if (!notificationEmailAddress) {
      this.log.error('Missing notification email address');
      return 'missing_email';
    }

    const resend = new Resend(this.apiKey);
    try {
      const { error } = await resend.emails.send({
        from: `Registration Form <${this.sender}>`,
        to: `${notificationEmailAddress}`,
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
