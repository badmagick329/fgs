import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import 'server-only';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_TTL_DAYS,
} from '@/lib/consts';
import { IToken } from '@/lib/serveronly/domain/interfaces';
import { AccessTokenPayload } from '@/types/auth';

export class Token implements IToken {
  constructor(private readonly jwtSecret: string) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    const secret = this.getEncodedSecret();
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(secret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const secret = this.getEncodedSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as AccessTokenPayload;
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  }

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  refreshTokenExpiresAt(): Date {
    const expires = new Date();
    expires.setDate(expires.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return expires;
  }

  private getEncodedSecret() {
    return new TextEncoder().encode(this.jwtSecret);
  }
}

