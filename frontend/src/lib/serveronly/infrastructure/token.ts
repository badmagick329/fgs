import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import 'server-only';
import { AUTH_TOKEN, AUTH_TTL } from '@/lib/consts';
import { IToken } from '@/lib/serveronly/domain/interfaces';
import { AccessTokenPayload } from '@/types/auth';

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
    return payload as AccessTokenPayload;
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

