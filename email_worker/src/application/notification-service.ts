import type {
  INotificationSender,
  IUserRepository,
} from '../domain/interfaces';

export class NotificationService {
  private db: IUserRepository;
  private notificationClient: INotificationSender;
  constructor(db: IUserRepository, notificationClient: INotificationSender) {
    this.db = db;
    this.notificationClient = notificationClient;
  }
  async processUnsentNotifications() {
    this.log('Checking Notifications');

    const fetchResult = await this.db.getPending();
    if (!fetchResult.ok) {
      this.logError(fetchResult.error);
      return;
    }

    if (fetchResult.data.length === 0) {
      this.log('No pending notifications found');
      return;
    }

    const notifications = fetchResult.data;
    this.log(`Fetched ${notifications.length} pending Notifications`);
    const sendResult = await this.notificationClient.send({
      payload: notifications,
    });

    await this.processSendResult(
      sendResult,
      notifications.map((d) => d.id)
    );
  }

  private async processSendResult(
    sendResult: Awaited<ReturnType<typeof this.notificationClient.send>>,
    notificationIds: number[]
  ) {
    if (!sendResult.ok) {
      console.error(`Failed to send: ${sendResult.error}`);
      const failUpdate = await this.db.setFailedStatus(notificationIds);
      if (!failUpdate.ok) {
        this.logError(
          `Failed to mark notifications as failed! - ${failUpdate.error}`
        );
      }
      return;
    }

    const successUpdate = await this.db.setSuccessStatus(notificationIds);
    if (!successUpdate.ok) {
      this.logError(
        `Failed to mark notifications as sent! - ${successUpdate.error}`
      );
    }
    this.log('All notifications processed successfully');
  }

  private logError(error: string) {
    console.error(
      `[${new Date().toISOString()}] - [NotificationService] - ${error}`
    );
  }

  private log(msg: string) {
    console.log(
      `[${new Date().toISOString()}] - [NotificationService] - ${msg}`
    );
  }
}
