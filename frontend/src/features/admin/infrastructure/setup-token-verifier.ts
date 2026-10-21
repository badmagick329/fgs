import { ISetupTokenVerifier } from '@/features/admin/domain/interfaces';
import crypto from 'node:crypto';
import 'server-only';

export class SetupTokenVerifier implements ISetupTokenVerifier {
  constructor(private readonly setupToken: string | undefined) {}

  isEnabled(): boolean {
    return Boolean(this.setupToken);
  }

  matches(candidate: string): boolean {
    if (!this.setupToken) {
      return false;
    }
    // Hashing first gives timingSafeEqual equal-length inputs, so neither the
    // content nor the length of the real token leaks through timing.
    return crypto.timingSafeEqual(digest(candidate), digest(this.setupToken));
  }
}

function digest(value: string) {
  return crypto.createHash('sha256').update(value).digest();
}
