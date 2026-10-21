import { describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));

const { SetupTokenVerifier } =
  await import('@/features/admin/infrastructure/setup-token-verifier');

describe('SetupTokenVerifier', () => {
  it('is disabled and matches nothing without a token', () => {
    const verifier = new SetupTokenVerifier(undefined);
    expect(verifier.isEnabled()).toBeFalse();
    expect(verifier.matches('')).toBeFalse();
    expect(verifier.matches('anything')).toBeFalse();
  });

  it('matches only the exact token', () => {
    const verifier = new SetupTokenVerifier('s3cret-token');
    expect(verifier.isEnabled()).toBeTrue();
    expect(verifier.matches('s3cret-token')).toBeTrue();
    expect(verifier.matches('s3cret-toke')).toBeFalse();
    expect(verifier.matches('s3cret-token-and-more')).toBeFalse();
    expect(verifier.matches('')).toBeFalse();
  });
});
