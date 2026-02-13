import {
  getPendingEmailsData,
  setFailedEmailStatus,
  setSuccessEmailStatus,
} from '@/lib/db.ts';
import { sendEmail } from '@/lib/email-client.ts';

async function main() {
  const workerInterval = getWorkerInterval();
  if (!workerInterval) return process.exit(1);

  await checkEmails();
  console.log(
    `[${new Date().toISOString()}] - Starting email worker. Next run in ${Math.ceil(workerInterval / 1000)} seconds`
  );
  setInterval(checkEmails, workerInterval);
}

function getWorkerInterval() {
  const workerInterval = parseInt(process.env.WORKER_INTERVAL || '0');
  if (isNaN(workerInterval) || workerInterval <= 1000) {
    console.error(`Invalid WORKER_INTERVAL value: ${workerInterval}`);
    return null;
  }
  if (workerInterval < 1000 * 60 * 10) {
    console.warn(
      `WORKER_INTERVAL is set to a low value (${workerInterval} ms). This may lead to rate limiting by the email provider.`
    );
  }
  return workerInterval;
}

async function checkEmails() {
  console.log(`[${new Date().toISOString()}] - Checking emails`);

  try {
    const emailsData = await getPendingEmailsData();

    if (emailsData.length === 0) {
      console.log(`[${new Date().toISOString()}] - No pending emails found`);
      return;
    }

    console.log(
      `[${new Date().toISOString()}] - Fetched ${emailsData.length} pending emails`
    );
    const result = await sendEmail({ email_data: emailsData });

    if (result.ok) {
      await setSuccessEmailStatus(emailsData.map((data) => data.id));
    } else {
      if (result.error === 'Notification email not configured.') {
        console.error('Notification email not configured. Skipping send.');
        return;
      }
      await setFailedEmailStatus(emailsData.map((data) => data.id));
    }
  } catch (error) {
    console.error('Error in checkEmails', error);
  }
}

main().catch((error) => {
  console.error('Fatal error in email worker', error);
  process.exit(1);
});
