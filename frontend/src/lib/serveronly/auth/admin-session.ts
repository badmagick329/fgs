import 'server-only';
import { createRefreshToken } from '../db';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from './common';
import { signAccessToken } from './jwt';

export async function issueAdminSession(admin: { id: number; email: string }) {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  await createRefreshToken(admin.id, tokenHash, refreshTokenExpiresAt());
  const accessToken = await signAccessToken({
    sub: String(admin.id),
    email: admin.email,
  });
  return { accessToken, refreshToken };
}
