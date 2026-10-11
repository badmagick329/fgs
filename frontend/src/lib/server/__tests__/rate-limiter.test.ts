import { describe, expect, it } from 'bun:test';
import { RateLimiter } from '@/lib/server/rate-limiter';

class FakeClock {
  constructor(public ms: number) {}
  now() {
    return new Date(this.ms);
  }
  nowMs() {
    return this.ms;
  }
}

describe('RateLimiter', () => {
  const options = { maxRequests: 2, windowMs: 1000, blockMs: 5000 };

  it('allows up to the limit per key, then blocks for the block period', () => {
    const clock = new FakeClock(0);
    const limiter = new RateLimiter(clock, options);

    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('a')).toBe(false);
    expect(limiter.allow('b')).toBe(true);

    // The window has passed but the block has not.
    clock.ms = 2000;
    expect(limiter.allow('a')).toBe(false);

    clock.ms = 5001;
    expect(limiter.allow('a')).toBe(true);
  });

  it('starts a fresh window once the last one ends', () => {
    const clock = new FakeClock(0);
    const limiter = new RateLimiter(clock, options);

    limiter.allow('a');
    limiter.allow('a');
    clock.ms = 1000;

    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('a')).toBe(true);
  });
});
