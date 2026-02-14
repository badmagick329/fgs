import { AccessTokenPayload } from '@/types/auth';

export interface IToken {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
  refreshTokenExpiresAt(): Date;
}
