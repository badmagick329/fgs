import type {
  INotificationSender,
  IUserRepository,
  Logger,
  LoggerFactory,
} from '../domain/interfaces';

export class NotificationService {
  private readonly db: IUserRepository;
  private readonly notificationClient: INotificationSender;
  private readonly log: Logger;

  constructor(
    db: IUserRepository,
    notificationClient: INotificationSender,
    loggerFactory: LoggerFactory
  ) {
    this.db = db;
    this.notificationClient = notificationClient;
    this.log = loggerFactory('NotificationService');
  }
  async processUnsentNotifications() {
    this.log.info('Checking Notifications');

    const fetchResult = await this.db.getPending();
    if (!fetchResult.ok) {
      this.log.error(fetchResult.error);
      return;
    }

    if (fetchResult.data.length === 0) {
      this.log.info('No pending notifications found');
      return;
    }

    const notifications = fetchResult.data;
    this.log.info(`Fetched ${notifications.length} pending Notifications`);
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
    if (sendResult === 'fail') {
      const failUpdate = await this.db.setFailedStatus(notificationIds);
      if (!failUpdate.ok) {
        this.log.error(
          `Failed to mark notifications as failed! - ${failUpdate.error}`
        );
      }
      return;
    }

    const successUpdate = await this.db.setSuccessStatus(notificationIds);
    if (!successUpdate.ok) {
      this.log.error(
        `Failed to mark notifications as sent! - ${successUpdate.error}`
      );
    }
    this.log.info('All notifications processed successfully');
  }
}
