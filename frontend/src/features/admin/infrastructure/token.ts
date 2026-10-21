import { AccessTokenPayload } from '@/features/admin/domain/auth';
import { IToken } from '@/features/admin/domain/interfaces';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'node:crypto';
import 'server-only';
import * as z from 'zod';
import { AUTH_TOKEN, AUTH_TTL } from '@/lib/consts';

const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.string(),
  sid: z.number().int().positive(),
});

export class Token implements IToken {
  constructor(private readonly jwtSecret: string) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    const secret = this.getEncodedSecret();
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${AUTH_TTL.accessSeconds}s`)
      .sign(secret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const secret = this.getEncodedSecret();
    const { payload } = await jwtVerify(token, secret);
    // Tokens signed before the session id existed lack `sid`; they cannot be
    // tied to a session, so they are refused and the caller refreshes.
    const parsed = accessTokenPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error('Access token payload is malformed.');
    }
    return parsed.data;
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(AUTH_TOKEN.refreshBytes).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  refreshTokenExpiresAt(): Date {
    const expires = new Date();
    expires.setDate(expires.getDate() + AUTH_TTL.refreshDays);
    return expires;
  }

  private getEncodedSecret() {
    return new TextEncoder().encode(this.jwtSecret);
  }
}
