import { scheduleSequentialRuns } from '@/application/schedule-sequential-runs';
import { describe, expect, test } from 'bun:test';
import { mockLoggerFactory } from './mock-logger';

const log = mockLoggerFactory('error')('scheduleSequentialRuns');
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('scheduleSequentialRuns', () => {
  test('never starts a run while the previous one is still going', async () => {
    let running = 0;
    let maxRunning = 0;
    let runs = 0;

    // Each run takes several intervals, which setInterval would overlap.
    const stop = scheduleSequentialRuns(
      async () => {
        running += 1;
        maxRunning = Math.max(maxRunning, running);
        await wait(40);
        running -= 1;
        runs += 1;
      },
      5,
      log
    );

    await wait(200);
    stop();

    expect(runs).toBeGreaterThanOrEqual(2);
    expect(maxRunning).toBe(1);
  });

  test('keeps running after a run throws', async () => {
    let runs = 0;
    const stop = scheduleSequentialRuns(
      async () => {
        runs += 1;
        throw new Error('boom');
      },
      5,
      log
    );

    await wait(80);
    stop();

    expect(runs).toBeGreaterThanOrEqual(2);
  });

  test('stop prevents further runs', async () => {
    let runs = 0;
    const stop = scheduleSequentialRuns(
      async () => {
        runs += 1;
      },
      5,
      log
    );

    stop();
    await wait(40);

    expect(runs).toBe(0);
  });
});
