import { IClock } from '@/lib/server/i-clock';

export type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
  /** How long a key stays blocked once it goes over the limit. */
  blockMs: number;
};

type RateLimitEntry = {
  count: number;
  windowEndsAtMs: number;
  blockedUntilMs: number;
};

const PRUNE_INTERVAL_MS = 60 * 1000;

/**
 * Fixed-window, in-memory rate limiter. The site runs as a single container,
 * so per-process state is enough; a restart only forgets recent counts.
 */
export class RateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private lastPruneAtMs = 0;

  constructor(
    private readonly clock: IClock,
    private readonly options: RateLimitOptions
  ) {}

  /** Counts one request for `key` and says whether it is allowed. */
  allow(key: string): boolean {
    const nowMs = this.clock.nowMs();
    this.prune(nowMs);

    const current = this.entries.get(key);
    if (current && current.blockedUntilMs > nowMs) {
      return false;
    }

    const entry =
      current && current.windowEndsAtMs > nowMs
        ? current
        : {
            count: 0,
            windowEndsAtMs: nowMs + this.options.windowMs,
            blockedUntilMs: 0,
          };

    entry.count += 1;
    this.entries.set(key, entry);
    if (entry.count > this.options.maxRequests) {
      entry.blockedUntilMs = nowMs + this.options.blockMs;
      return false;
    }
    return true;
  }

  private prune(nowMs: number) {
    if (nowMs - this.lastPruneAtMs < PRUNE_INTERVAL_MS) {
      return;
    }
    for (const [key, entry] of this.entries.entries()) {
      if (entry.windowEndsAtMs <= nowMs && entry.blockedUntilMs <= nowMs) {
        this.entries.delete(key);
      }
    }
    this.lastPruneAtMs = nowMs;
  }
}
