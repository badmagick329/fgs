import type {
  INotificationSender,
  IUserRepository,
  Logger,
  LoggerCreator,
} from '../domain/interfaces';

/** Rows mailed per pass: one email lists at most this many registrations. */
export const NOTIFICATION_BATCH_SIZE = 25;
/**
 * How long a claim protects its rows. A pass sends one email, which takes
 * seconds, so a claim this old means the pass that took it died before
 * recording a result and its rows should be retried.
 */
export const NOTIFICATION_CLAIM_TIMEOUT_MS = 15 * 60 * 1000;

export class NotificationService {
  private readonly db: IUserRepository;
  private readonly notificationClient: INotificationSender;
  private readonly log: Logger;

  constructor(
    db: IUserRepository,
    notificationClient: INotificationSender,
    loggerCreator: LoggerCreator
  ) {
    this.db = db;
    this.notificationClient = notificationClient;
    this.log = loggerCreator('NotificationService');
  }

  async processUnsentNotifications(workerIntervalMs: number) {
    await this.db.markWorkerCycleStarted(
      new Date(Date.now() + workerIntervalMs)
    );
    this.log.info('Checking Notifications');

    await this.processClaimedBatch();

    // The next pass is scheduled only once this one ends, so the countdown
    // runs from the finish time.
    await this.db.markWorkerCycleFinished(
      new Date(Date.now() + workerIntervalMs)
    );
  }

  private async processClaimedBatch() {
    const claimResult = await this.db.claimPending(
      NOTIFICATION_BATCH_SIZE,
      NOTIFICATION_CLAIM_TIMEOUT_MS
    );
    if (!claimResult.ok) {
      this.log.error(claimResult.error);
      return;
    }

    if (claimResult.data.length === 0) {
      this.log.info('No pending notifications found');
      return;
    }

    const notifications = claimResult.data;
    const notificationIds = notifications.map((d) => d.id);
    this.log.info(`Claimed ${notifications.length} pending Notifications`);
    const sendResult = await this.notificationClient.send({
      payload: notifications,
    });

    await this.processSendResult(sendResult, notificationIds);
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

    if (sendResult === 'missing_email') {
      this.log.warn(
        'Missing notification email. Releasing claims without status updates.'
      );
      await this.db.releaseClaims(notificationIds);
      return;
    }

    const successUpdate = await this.db.setSuccessStatus(notificationIds);
    if (!successUpdate.ok) {
      // The email went out but the rows stay claimed; they are resent once the
      // claim times out.
      this.log.error(
        `Failed to mark notifications as sent! - ${successUpdate.error}`
      );
    }
    this.log.info(
      `${notificationIds.length} notifications processed successfully`
    );
  }
}
