export async function register() {
  // The jobs use Node APIs; the edge runtime also calls register().
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { startScheduledJobs } = await import('@/lib/server/scheduled-jobs');
  startScheduledJobs();
}
