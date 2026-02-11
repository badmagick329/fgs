import {
  generateRefreshToken,
  getAdminById,
  getRefreshTokenByHash,
  hashRefreshToken,
  refreshTokenExpiresAt,
  revokeAllRefreshTokensForUser,
  rotateRefreshToken,
} from '@/lib/serveronly/auth';
import { signAccessToken } from '@/lib/auth/jwt';

export async function refreshSession(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  const tokenRow = await getRefreshTokenByHash(tokenHash);
  if (!tokenRow) {
    return null;
  }

  if (tokenRow.revoked_at) {
    await revokeAllRefreshTokensForUser(tokenRow.admin_user_id);
    return null;
  }

  const expiresAt = new Date(tokenRow.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);
  const newToken = await rotateRefreshToken(
    tokenRow.id,
    tokenRow.admin_user_id,
    newTokenHash,
    refreshTokenExpiresAt()
  );

  const admin = await getAdminById(newToken.admin_user_id);
  if (!admin) {
    await revokeAllRefreshTokensForUser(newToken.admin_user_id);
    return null;
  }

  const accessToken = await signAccessToken({
    sub: String(newToken.admin_user_id),
    email: admin.email,
  });

  return { accessToken, refreshToken: newRefreshToken };
}
