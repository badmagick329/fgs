import { AccessTokenPayload } from '@/features/admin/domain/auth';

export interface IToken {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  generateRefreshToken(): string;
  hashRefreshToken(token: string): string;
  refreshTokenExpiresAt(): Date;
}
