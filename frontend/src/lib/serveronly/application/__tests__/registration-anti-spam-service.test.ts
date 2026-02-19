import { describe, expect, it } from 'bun:test';
import { RegistrationAntiSpamService } from '@/lib/serveronly/application/registration-anti-spam-service';
import { IClock } from '@/lib/serveronly/domain/interfaces';

class FakeClock implements IClock {
  constructor(private currentMs: number) {}

  now(): Date {
    return new Date(this.currentMs);
  }

  nowMs(): number {
    return this.currentMs;
  }

  advanceBy(ms: number) {
    this.currentMs += ms;
  }
}

describe('RegistrationAntiSpamService', () => {
  it('blocks after 5 requests per IP and route', () => {
    const clock = new FakeClock(100_000);
    const service = new RegistrationAntiSpamService(clock);

    for (let i = 0; i < 5; i += 1) {
      const result = service.checkRateLimit({
        ip: '1.2.3.4',
        route: '/api/register',
      });
      expect(result.ok).toBe(true);
    }

    const blocked = service.checkRateLimit({
      ip: '1.2.3.4',
      route: '/api/register',
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.status).toBe(429);
    }
  });

  it('blocks honeypot-filled requests', () => {
    const clock = new FakeClock(100_000);
    const service = new RegistrationAntiSpamService(clock);

    const blocked = service.checkHoneypot('filled');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.status).toBe(400);
    }
  });

  it('blocks submissions that are too fast', () => {
    const clock = new FakeClock(100_000);
    const service = new RegistrationAntiSpamService(clock);

    const blocked = service.checkMinimumSubmitTime(99_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.status).toBe(400);
    }
  });

  it('blocks duplicate payloads during cooldown', () => {
    const clock = new FakeClock(100_000);
    const service = new RegistrationAntiSpamService(clock);
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    const firstCheck = service.checkPayloadCooldown(payload);
    expect(firstCheck.ok).toBe(true);

    service.markPayloadSubmitted(payload);

    const duplicateCheck = service.checkPayloadCooldown(payload);
    expect(duplicateCheck.ok).toBe(false);
    if (!duplicateCheck.ok) {
      expect(duplicateCheck.status).toBe(409);
    }
  });

  it('allows duplicate payload after cooldown window', () => {
    const clock = new FakeClock(100_000);
    const service = new RegistrationAntiSpamService(clock);
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    service.markPayloadSubmitted(payload);
    clock.advanceBy(10 * 60 * 1000 + 1);

    const check = service.checkPayloadCooldown(payload);
    expect(check.ok).toBe(true);
  });
});
