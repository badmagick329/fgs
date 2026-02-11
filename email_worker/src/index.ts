import { getPendingEmailsData } from '@/lib/db.ts';
import { EmailClient } from '@/lib/email-client.ts';
import { readConfigFromSchema } from './lib/config-reader';
import type { Result } from './types/result';
import { emailConfigSchema } from './types/schemas';

async function main(): Promise<void> {
  const workerInterval = getWorkerInterval();
  if (!workerInterval.ok) return process.exit(1);

  await checkEmails();
  console.log(
    `[${new Date().toISOString()}] - Starting email worker. Next run in ${Math.ceil(workerInterval.data / 1000)} seconds`
  );
  setInterval(checkEmails, workerInterval.data);
}

function getWorkerInterval(): Result<number, string> {
  const workerInterval = parseInt(process.env.WORKER_INTERVAL || '0');
  if (isNaN(workerInterval) || workerInterval <= 1000) {
    console.error(`Invalid WORKER_INTERVAL value: ${workerInterval}`);
    return {
      ok: false,
      error: `Invalid WORKER_INTERVAL value: ${workerInterval}`,
    };
  }
  if (workerInterval < 1000 * 60 * 10) {
    console.warn(
      `WORKER_INTERVAL is set to a low value (${workerInterval} ms). This may lead to rate limiting by the email provider.`
    );
    return {
      ok: false,
      error: `WORKER_INTERVAL is set to a low value (${workerInterval} ms). This may lead to rate limiting by the email provider.`,
    };
  }
  return {
    ok: true,
    data: workerInterval,
  };
}

async function checkEmails(): Promise<Result<string, string>> {
  console.log(`[${new Date().toISOString()}] - Checking emails`);

  try {
    const emails = await getPendingEmailsData();

    if (emails.length > 0) {
      console.log(
        `[${new Date().toISOString()}] - Fetched ${emails.length} pending emails`
      );
      const configFromSchema = readConfigFromSchema(emailConfigSchema);
      const emailClient = new EmailClient(configFromSchema);
      emailClient.sendEmail({ email_data: emails });
      return { ok: true, data: 'Success' };
    }
    console.log(`[${new Date().toISOString()}] - No pending emails found`);
    return { ok: false, error: 'No pending emails found' };
  } catch (error) {
    console.error('Error in checkEmails', error);
    return { ok: false, error: 'Emails not sent' };
  }
}

main().catch((error) => {
  console.error('Fatal error in email worker', error);
  process.exit(1);
});
