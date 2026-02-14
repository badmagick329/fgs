import { DB } from '@/infrastructure/db/db';
import { NotificationService } from './application/notification-service';
import { Config, getDatabaseConfig } from './infrastructure/config';
import { getWorkerInterval } from './infrastructure/config/interval';
import { EmailClient } from './infrastructure/email/email-client';

async function main(): Promise<void> {
  const dbConfig = getDatabaseConfig();
  const db = await DB.create(dbConfig.database_url);

  const notificationEmail =
    (await db.getNotificationEmail())?.notification_email ?? '';
  const emailConfig = new Config(notificationEmail).read();
  const emailClient = new EmailClient(emailConfig);

  const workerInterval = getWorkerInterval();
  if (workerInterval == null) return process.exit(1);

  const service = new NotificationService(db, emailClient);
  await service.processUnsentNotifications();
  console.log(
    `[${new Date().toISOString()}] - [Main] Starting notification worker. Next run in ${Math.ceil(workerInterval / 1000)} seconds`
  );
  setInterval(service.processUnsentNotifications.bind(service), workerInterval);
}

main().catch((error) => {
  console.error('Fatal error in notification worker', error);
  process.exit(1);
});
