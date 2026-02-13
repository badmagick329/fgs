import type { Result } from '@/types/result';

export function getWorkerInterval(): Result<number, string> {
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
  }
  return {
    ok: true,
    data: workerInterval,
  };
}
