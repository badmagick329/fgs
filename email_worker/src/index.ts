import { DB } from '@/infrastructure/db/db';
import { NotificationService } from './core/NotificationService';
import { readConfigFromSchema } from './infrastructure/config';
import { getWorkerInterval } from './infrastructure/config/interval';
import { emailConfigSchema } from './infrastructure/config/schemas';
import { EmailClient } from './infrastructure/email/email-client';

async function main(): Promise<void> {
  const db = new DB();
  const notificationEmail =
    (await db.getNotificationEmail())?.notification_email ?? '';

  const configFromSchema = readConfigFromSchema(
    emailConfigSchema,
    notificationEmail
  );

  const emailClient = new EmailClient(configFromSchema);
  const workerInterval = getWorkerInterval();
  if (!workerInterval.ok) return process.exit(1);

  const service = new NotificationService(db, emailClient);
  await service.processUnsentNotifications();
  console.log(
    `[${new Date().toISOString()}] - Starting notification worker. Next run in ${Math.ceil(workerInterval.data / 1000)} seconds`
  );
  setInterval(service.processUnsentNotifications, workerInterval.data);
}

main().catch((error) => {
  console.error('Fatal error in notification worker', error);
  process.exit(1);
});
