import { IClock } from '@/lib/serveronly/domain/interfaces';

export const REGISTER_RATE_LIMIT_MAX_REQUESTS = 5;
export const REGISTER_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const REGISTER_RATE_LIMIT_BLOCK_MS = 10 * 60 * 1000;
export const REGISTER_MIN_SUBMIT_TIME_MS = 3000;
export const REGISTER_PAYLOAD_COOLDOWN_MS = 10 * 60 * 1000;

export type AntiSpamCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      status: 400 | 409 | 429;
      message: string;
    };

type RateLimitEntry = {
  count: number;
  windowEndsAtMs: number;
  blockedUntilMs: number;
};

const RATE_LIMIT_MESSAGE =
  'Too many attempts from this network. Please try again in a few minutes.';
const HONEYPOT_MESSAGE =
  'Submission was rejected by spam protection. Please refresh and try again.';
const SUBMIT_TOO_FAST_MESSAGE =
  'Form was submitted too quickly. Please wait a few seconds and try again.';
const DUPLICATE_PAYLOAD_MESSAGE =
  'This registration was already submitted recently. Please wait before submitting again.';

export class RegistrationAntiSpamService {
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private readonly payloadCooldowns = new Map<string, number>();
  private lastPruneAtMs = 0;

  constructor(private readonly clock: IClock) {}

  checkRateLimit(input: { ip: string; route: string }): AntiSpamCheckResult {
    const nowMs = this.clock.nowMs();
    this.pruneExpiredEntries(nowMs);

    const key = `${input.ip}:${input.route}`;
    const current = this.rateLimits.get(key);

    if (current && current.blockedUntilMs > nowMs) {
      return {
        ok: false,
        status: 429,
        message: RATE_LIMIT_MESSAGE,
      };
    }

    const entry =
      current && current.windowEndsAtMs > nowMs
        ? current
        : {
            count: 0,
            windowEndsAtMs: nowMs + REGISTER_RATE_LIMIT_WINDOW_MS,
            blockedUntilMs: 0,
          };

    entry.count += 1;
    if (entry.count > REGISTER_RATE_LIMIT_MAX_REQUESTS) {
      entry.blockedUntilMs = nowMs + REGISTER_RATE_LIMIT_BLOCK_MS;
      this.rateLimits.set(key, entry);
      return {
        ok: false,
        status: 429,
        message: RATE_LIMIT_MESSAGE,
      };
    }

    this.rateLimits.set(key, entry);
    return { ok: true };
  }

  checkHoneypot(value: string | undefined): AntiSpamCheckResult {
    if (typeof value === 'string' && value.trim().length > 0) {
      return {
        ok: false,
        status: 400,
        message: HONEYPOT_MESSAGE,
      };
    }

    return { ok: true };
  }

  checkMinimumSubmitTime(
    formStartedAt: number | undefined
  ): AntiSpamCheckResult {
    const nowMs = this.clock.nowMs();

    if (!Number.isFinite(formStartedAt)) {
      return {
        ok: false,
        status: 400,
        message: SUBMIT_TOO_FAST_MESSAGE,
      };
    }

    const elapsedMs = nowMs - Number(formStartedAt);
    if (elapsedMs < REGISTER_MIN_SUBMIT_TIME_MS) {
      return {
        ok: false,
        status: 400,
        message: SUBMIT_TOO_FAST_MESSAGE,
      };
    }

    return { ok: true };
  }

  checkPayloadCooldown(input: {
    firstName: string;
    lastName: string;
    email: string;
  }): AntiSpamCheckResult {
    const nowMs = this.clock.nowMs();
    this.pruneExpiredEntries(nowMs);

    const key = this.createPayloadKey(input);
    const cooldownUntilMs = this.payloadCooldowns.get(key);
    if (typeof cooldownUntilMs === 'number' && cooldownUntilMs > nowMs) {
      return {
        ok: false,
        status: 409,
        message: DUPLICATE_PAYLOAD_MESSAGE,
      };
    }

    return { ok: true };
  }

  markPayloadSubmitted(input: {
    firstName: string;
    lastName: string;
    email: string;
  }) {
    const nowMs = this.clock.nowMs();
    this.pruneExpiredEntries(nowMs);

    const key = this.createPayloadKey(input);
    this.payloadCooldowns.set(key, nowMs + REGISTER_PAYLOAD_COOLDOWN_MS);
  }

  private createPayloadKey(input: {
    firstName: string;
    lastName: string;
    email: string;
  }): string {
    const normalizedFirstName = input.firstName.trim().toLowerCase();
    const normalizedLastName = input.lastName.trim().toLowerCase();
    const normalizedEmail = input.email.trim().toLowerCase();

    return `${normalizedFirstName}|${normalizedLastName}|${normalizedEmail}`;
  }

  private pruneExpiredEntries(nowMs: number) {
    if (nowMs - this.lastPruneAtMs < 60 * 1000) {
      return;
    }

    for (const [key, entry] of this.rateLimits.entries()) {
      if (entry.windowEndsAtMs <= nowMs && entry.blockedUntilMs <= nowMs) {
        this.rateLimits.delete(key);
      }
    }

    for (const [key, cooldownUntilMs] of this.payloadCooldowns.entries()) {
      if (cooldownUntilMs <= nowMs) {
        this.payloadCooldowns.delete(key);
      }
    }

    this.lastPruneAtMs = nowMs;
  }
}
