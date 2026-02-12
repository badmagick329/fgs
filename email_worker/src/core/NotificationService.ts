import type { Result } from '@/types/result';
import type { INotificationSender, IUserRepository } from './interfaces';

// add interface

export class NotificationService {
  private db: IUserRepository;
  private notificationClient: INotificationSender;
  constructor(db: IUserRepository, notificationClient: INotificationSender) {
    this.db = db;
    this.notificationClient = notificationClient;
  }
  async processUnsentNotifications(): Promise<Result<string, string>> {
    console.log(`[${new Date().toISOString()}] - Checking Notifications`);

    try {
      const fetchResult = await this.db.getPending();
      if (!fetchResult.ok) {
        console.log(
          `[${new Date().toISOString()}] - No pending notifications found`
        );
        return { ok: false, error: 'No pending notification found' };
      }
      const notifications = fetchResult.data;
      console.log(
        `[${new Date().toISOString()}] - Fetched ${notifications.length} pending Notifications`
      );
      const sendResult = await this.notificationClient.send({
        payload: notifications,
      });
      const ids = notifications.map((d) => d.id);
      if (!sendResult.ok) {
        console.error(`Failed to send: ${sendResult.error}`);
        const failUpdate = await this.db.setFailedStatus(ids);
        if (!failUpdate.ok) {
          console.error(
            'CRITICAL: Failed to mark notifications as failed!',
            failUpdate.error
          );
        }
        return { ok: false, error: 'Send Failure' };
      }
      const successUpdate = await this.db.setSuccessStatus(ids);
      if (!successUpdate.ok) {
        console.error(
          'CRITICAL: Failed to mark notifications as sent!',
          successUpdate.error
        );
        return { ok: false, error: 'DB Update Failure after Send' };
      }
      return { ok: true, data: 'All Notifications processed successfully' };
    } catch (error) {
      console.error('Error in checkNotification', error);
      return { ok: false, error: 'Notification not sent' };
    }
  }
}
