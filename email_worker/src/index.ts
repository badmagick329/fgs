import { DB } from '@/infrastructure/db/db';
import { NotificationService } from './core/notification-service';
import { getEmailConfig } from './infrastructure/config';
import { databaseConfig } from './infrastructure/config';
import { getWorkerInterval } from './infrastructure/config/interval';
import { EmailClient } from './infrastructure/email/email-client';

async function main(): Promise<void> {
  const connectionString = databaseConfig.DATABASE_URL;
  const db = new DB(connectionString);

  const notificationEmail =
    (await db.getNotificationEmail())?.notification_email ?? '';
  const emailConfig = getEmailConfig(notificationEmail);
  const emailClient = new EmailClient(emailConfig);

  const workerInterval = getWorkerInterval();
  if (!workerInterval.ok) return process.exit(1);

  const service = new NotificationService(db, emailClient);
  await service.processUnsentNotifications();
  console.log(
    `[${new Date().toISOString()}] - [Main] Starting notification worker. Next run in ${Math.ceil(workerInterval.data / 1000)} seconds`
  );
  setInterval(
    service.processUnsentNotifications.bind(service),
    workerInterval.data
  );
}

main().catch((error) => {
  console.error('Fatal error in notification worker', error);
  process.exit(1);
});
