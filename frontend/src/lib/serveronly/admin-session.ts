import 'server-only';
import { signAccessToken } from '@/lib/auth/jwt';
import {
  createRefreshToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from '@/lib/serveronly/auth';

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
