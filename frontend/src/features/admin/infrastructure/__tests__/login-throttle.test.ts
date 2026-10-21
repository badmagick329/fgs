import { LoginThrottle } from '@/features/admin/infrastructure/login-throttle';
import { describe, expect, it } from 'bun:test';

function makeThrottle() {
  let nowMs = 1_000_000;
  const clock = { now: () => new Date(nowMs), nowMs: () => nowMs };
  const throttle = new LoginThrottle(clock, {
    maxFailuresPerEmail: 5,
    maxFailuresPerIp: 20,
    windowMs: 15 * 60 * 1000,
  });
  return {
    throttle,
    advance: (ms: number) => {
      nowMs += ms;
    },
  };
}

describe('LoginThrottle', () => {
  it('locks an email at its fifth failure until the window ends', () => {
    const { throttle, advance } = makeThrottle();
    const keys = { email: 'admin@example.com', ip: '203.0.113.1' };

    for (let i = 0; i < 4; i += 1) throttle.recordFailure(keys);
    expect(throttle.retryAfterSeconds(keys)).toBe(0);

    throttle.recordFailure(keys);
    expect(throttle.retryAfterSeconds(keys)).toBe(15 * 60);
    // Another address does not escape the email lock.
    expect(
      throttle.retryAfterSeconds({ email: keys.email, ip: '198.51.100.1' })
    ).toBe(15 * 60);

    advance(10 * 60 * 1000);
    expect(throttle.retryAfterSeconds(keys)).toBe(5 * 60);

    advance(5 * 60 * 1000);
    expect(throttle.retryAfterSeconds(keys)).toBe(0);
  });

  it('locks an IP spraying many emails at twenty failures', () => {
    const { throttle } = makeThrottle();
    const ip = '203.0.113.1';

    for (let i = 0; i < 19; i += 1) {
      throttle.recordFailure({ email: `user${i}@example.com`, ip });
    }
    expect(throttle.retryAfterSeconds({ email: 'fresh@example.com', ip })).toBe(
      0
    );

    throttle.recordFailure({ email: 'user19@example.com', ip });
    expect(
      throttle.retryAfterSeconds({ email: 'fresh@example.com', ip })
    ).toBeGreaterThan(0);
    expect(
      throttle.retryAfterSeconds({
        email: 'fresh@example.com',
        ip: '198.51.100.1',
      })
    ).toBe(0);
  });

  it('success clears the email count but keeps the IP count', () => {
    const { throttle } = makeThrottle();
    const ip = '203.0.113.1';
    for (let i = 0; i < 19; i += 1) {
      throttle.recordFailure({ email: 'admin@example.com', ip });
    }

    throttle.recordSuccess({ email: 'admin@example.com', ip });
    throttle.recordFailure({ email: 'other@example.com', ip });

    expect(
      throttle.retryAfterSeconds({ email: 'admin@example.com', ip: 'x' })
    ).toBe(0);
    expect(
      throttle.retryAfterSeconds({ email: 'admin@example.com', ip })
    ).toBeGreaterThan(0);
  });
});
