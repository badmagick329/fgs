import { describe, expect, it, mock } from 'bun:test';
import { SignJWT } from 'jose';

mock.module('server-only', () => ({}));

const { Token } = await import('@/features/admin/infrastructure/token');

describe('Token', () => {
  it('round-trips the session id', async () => {
    const token = new Token('secret');
    const signed = await token.signAccessToken({
      sub: '1',
      email: 'admin@example.com',
      sid: 42,
    });

    const payload = await token.verifyAccessToken(signed);

    expect(payload).toMatchObject({
      sub: '1',
      email: 'admin@example.com',
      sid: 42,
    });
  });

  it('rejects signed tokens without a session id', async () => {
    const legacy = await new SignJWT({ sub: '1', email: 'admin@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(new TextEncoder().encode('secret'));

    await expect(new Token('secret').verifyAccessToken(legacy)).rejects.toThrow(
      'malformed'
    );
  });
});
