import 'server-only';
import { getServerContainer } from '@/lib/server/container';

const ALUMNI_STORY_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_SWEEP_DELAY_MS = 60 * 1000;

declare global {
  // eslint-disable-next-line no-var
  var __fgsScheduledJobsStarted: boolean | undefined;
}

async function sweepAlumniStoryDrafts() {
  try {
    const removed =
      await getServerContainer().alumniStoryUploads.uploads.sweep();
    if (removed.drafts || removed.stagedUploads) {
      console.info('alumni story sweep', removed);
    }
  } catch (error) {
    console.error('alumni story sweep failed', error);
  }
}

/**
 * Starts in-process timers once per server. The site runs as one container,
 * so there is no second instance to race; timers are unref'd so they never
 * hold the process open.
 */
export function startScheduledJobs() {
  if (globalThis.__fgsScheduledJobsStarted) return;
  globalThis.__fgsScheduledJobsStarted = true;

  setTimeout(sweepAlumniStoryDrafts, FIRST_SWEEP_DELAY_MS).unref();
  setInterval(sweepAlumniStoryDrafts, ALUMNI_STORY_SWEEP_INTERVAL_MS).unref();
}
