import { describe, expect, it } from 'bun:test';
import { SignJWT } from 'jose';
import { AccessToken } from '@/lib/middleware/access-token';

describe('AccessToken', () => {
  it('verifies valid token', async () => {
    const secret = new TextEncoder().encode('secret');
    const token = await new SignJWT({ sub: '1', email: 'admin@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(secret);

    const verifier = new AccessToken('secret');
    const payload = await verifier.verify(token);

    expect(payload.sub).toBe('1');
  });

  it('throws for invalid token', async () => {
    const verifier = new AccessToken('secret');
    await expect(verifier.verify('bad-token')).rejects.toBeDefined();
  });
});
