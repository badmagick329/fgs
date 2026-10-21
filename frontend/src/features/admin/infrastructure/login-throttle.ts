import {
  ILoginThrottle,
  LoginAttemptKeys,
} from '@/features/admin/domain/interfaces';
import { IClock } from '@/lib/server/i-clock';

export type LoginThrottleLimits = {
  /** Failures one email may collect in a window before it cools down. */
  maxFailuresPerEmail: number;
  /** Higher than per email: a school office may share one address. */
  maxFailuresPerIp: number;
  windowMs: number;
};

/**
 * Per email, a handful of guesses is plenty for a typo-prone human and far
 * too few for a guessing script. The IP limit catches one caller spraying
 * many emails.
 */
export const DEFAULT_LOGIN_THROTTLE_LIMITS: LoginThrottleLimits = {
  maxFailuresPerEmail: 5,
  maxFailuresPerIp: 20,
  windowMs: 15 * 60 * 1000,
};

type FailureWindow = { count: number; endsAtMs: number };

const PRUNE_INTERVAL_MS = 60 * 1000;

/**
 * Fixed-window failure counter. A key that reaches its limit stays locked
 * until its window ends. In memory because the site runs as one container;
 * a restart forgets counts, which only costs an attacker's lost progress.
 */
export class LoginThrottle implements ILoginThrottle {
  private readonly emailFailures = new Map<string, FailureWindow>();
  private readonly ipFailures = new Map<string, FailureWindow>();
  private lastPruneAtMs = 0;

  constructor(
    private readonly clock: IClock,
    private readonly limits: LoginThrottleLimits = DEFAULT_LOGIN_THROTTLE_LIMITS
  ) {}

  retryAfterSeconds(keys: LoginAttemptKeys): number {
    const nowMs = this.clock.nowMs();
    this.prune(nowMs);
    const waitMs = Math.max(
      this.lockedForMs(
        this.emailFailures.get(keys.email),
        this.limits.maxFailuresPerEmail,
        nowMs
      ),
      this.lockedForMs(
        this.ipFailures.get(keys.ip),
        this.limits.maxFailuresPerIp,
        nowMs
      )
    );
    return Math.ceil(waitMs / 1000);
  }

  recordFailure(keys: LoginAttemptKeys): void {
    const nowMs = this.clock.nowMs();
    this.increment(this.emailFailures, keys.email, nowMs);
    this.increment(this.ipFailures, keys.ip, nowMs);
  }

  recordSuccess(keys: LoginAttemptKeys): void {
    this.emailFailures.delete(keys.email);
  }

  private lockedForMs(
    entry: FailureWindow | undefined,
    maxFailures: number,
    nowMs: number
  ) {
    if (!entry || entry.endsAtMs <= nowMs || entry.count < maxFailures) {
      return 0;
    }
    return entry.endsAtMs - nowMs;
  }

  private increment(
    failures: Map<string, FailureWindow>,
    key: string,
    nowMs: number
  ) {
    const current = failures.get(key);
    if (current && current.endsAtMs > nowMs) {
      current.count += 1;
      return;
    }
    failures.set(key, { count: 1, endsAtMs: nowMs + this.limits.windowMs });
  }

  private prune(nowMs: number) {
    if (nowMs - this.lastPruneAtMs < PRUNE_INTERVAL_MS) {
      return;
    }
    for (const failures of [this.emailFailures, this.ipFailures]) {
      for (const [key, entry] of failures.entries()) {
        if (entry.endsAtMs <= nowMs) {
          failures.delete(key);
        }
      }
    }
    this.lastPruneAtMs = nowMs;
  }
}
