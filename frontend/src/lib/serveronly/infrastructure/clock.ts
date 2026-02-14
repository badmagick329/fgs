import 'server-only';
import { IClock } from '@/lib/serveronly/domain/interfaces';

export class Clock implements IClock {
  now(): Date {
    return new Date();
  }

  nowMs(): number {
    return Date.now();
  }
}

