import { getPendingEmails } from "../frontend/src/lib/db.ts";
import { sendEmail } from "../frontend/src/actions/email-actions.ts";

async function main() {
  const workerInterval = getWorkerInterval();
  if (!workerInterval) return process.exit(1);

  await checkEmails();
  console.log(`[${new Date().toISOString()}] - Starting email worker`);
  setInterval(checkEmails, workerInterval);
}

function getWorkerInterval() {
  const workerInterval = parseInt(process.env.WORKER_INTERVAL || "0");
  if (isNaN(workerInterval) || workerInterval <= 1000) {
    console.error(`Invalid WORKER_INTERVAL value: ${workerInterval}`);
    return null;
  }
  if (workerInterval < 1000 * 60 * 10) {
    console.warn(
      `WORKER_INTERVAL is set to a low value (${workerInterval} ms). This may lead to rate limiting by the email provider.`,
    );
  }
  return workerInterval;
}

async function checkEmails() {
  console.log(`[${new Date().toISOString()}] - Checking emails`);

  try {
    const emails = await getPendingEmails();

    if (emails.length > 0) {
      console.log(
        `[${new Date().toISOString()}] - Fetched ${emails.length} pending emails`,
      );
      sendEmail({ email_data: emails });
      return;
    }
    console.log(`[${new Date().toISOString()}] - No pending emails found`);
  } catch (error) {
    console.error("Error in checkEmails", error);
  }
}

main().catch((error) => {
  console.error("Fatal error in email worker", error);
  process.exit(1);
});
