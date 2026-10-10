import 'server-only';
import { IClock } from '@/lib/server/i-clock';

export class Clock implements IClock {
  now(): Date {
    return new Date();
  }

  nowMs(): number {
    return Date.now();
  }
}
