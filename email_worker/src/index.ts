import { DB } from '@/infrastructure/db/db';
import { loggerFactory } from '@/infrastructure/logger';
import { NotificationService } from './application/notification-service';
import {
  emailConfigReader,
  getDatabaseConfig,
  getLoggerLevel,
  getWorkerInterval,
} from './infrastructure/config';
import { EmailClient } from './infrastructure/email/email-client';

const _loggerFactory = loggerFactory(getLoggerLevel());
const log = _loggerFactory('Main');

async function main(): Promise<void> {
  const dbConfig = getDatabaseConfig();
  const db = await DB.create(dbConfig.database_url, _loggerFactory);
  const notificationEmail =
    (await db.getNotificationEmail())?.notification_email ?? '';
  const emailConfig = emailConfigReader(notificationEmail);
  const emailClient = new EmailClient(
    {
      ...emailConfig,
      getNotificationEmailData: db.getNotificationEmail.bind(db),
    },
    _loggerFactory
  );

  const workerInterval = getWorkerInterval(_loggerFactory('getWorkerInterval'));
  if (workerInterval == null) return process.exit(1);

  const service = new NotificationService(db, emailClient, _loggerFactory);
  await service.processUnsentNotifications();
  log.info(
    `Starting notification worker. Next run in ${Math.ceil(workerInterval / 1000)} seconds`
  );
  setInterval(service.processUnsentNotifications.bind(service), workerInterval);
}

main().catch((error) => {
  log.error('Fatal error in notification worker', error);
  process.exit(1);
});
