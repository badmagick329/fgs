import type { Logger } from '../domain/interfaces';

/**
 * Runs `task` every `intervalMs`, timing each wait from the end of the
 * previous run. Unlike setInterval this never starts a run while the last one
 * is still going, and a run that throws is logged without ending the loop.
 * Returns a function that stops further runs.
 */
export function scheduleSequentialRuns(
  task: () => Promise<void>,
  intervalMs: number,
  log: Logger
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const scheduleNext = () => {
    if (stopped) return;
    timer = setTimeout(async () => {
      try {
        await task();
      } catch (error) {
        log.error('Scheduled run failed', error);
      }
      scheduleNext();
    }, intervalMs);
  };

  scheduleNext();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
