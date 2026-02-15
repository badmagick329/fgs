import type { Logger } from '@/domain/interfaces';

export function getWorkerInterval(log: Logger): number | null {
  const workerInterval = parseInt(process.env.WORKER_INTERVAL || '0');
  if (isNaN(workerInterval) || workerInterval <= 1000) {
    log.error(`Invalid WORKER_INTERVAL value: ${workerInterval}`);
    return null;
  }
  if (workerInterval < 1000 * 60 * 10) {
    log.warn(
      `WORKER_INTERVAL is set to a low value (${workerInterval} ms). This may lead to rate limiting by the email provider.`
    );
  }
  return workerInterval;
}
