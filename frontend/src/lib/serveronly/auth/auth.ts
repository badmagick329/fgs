import { AdminActionError } from '@/types/auth';
import 'server-only';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from '@/lib/serveronly/auth/common';
import { signAccessToken } from '@/lib/serveronly/auth/jwt';
import {
  countSuperAdmins,
  deleteAdminUserById,
  getAdminAuthById,
  getAdminById,
  getRefreshTokenByHash,
  reassignAdminConfigUpdater,
  revokeAllRefreshTokensForUser,
  rotateRefreshToken,
  setAdminSuperStatus,
  withTransaction,
} from '@/lib/serveronly/db';

export async function updateAdminSuperStatusWithGuards({
  actingAdminId,
  targetAdminId,
  isSuperAdmin,
}: {
  actingAdminId: number;
  targetAdminId: number;
  isSuperAdmin: boolean;
}) {
  return withTransaction(async (client) => {
    const actingAdmin = await getAdminAuthById(actingAdminId, client);
    if (!actingAdmin) {
      throw new AdminActionError('Unauthorized.', 401);
    }
    if (!actingAdmin.is_super_admin) {
      throw new AdminActionError(
        'Only super admins can change admin roles.',
        403
      );
    }

    const targetAdmin = await getAdminAuthById(targetAdminId, client);
    if (!targetAdmin) {
      throw new AdminActionError('Admin not found.', 404);
    }

    if (targetAdmin.is_super_admin === isSuperAdmin) {
      return targetAdmin;
    }

    if (targetAdmin.is_super_admin && !isSuperAdmin) {
      const superAdminCount = await countSuperAdmins(client);
      if (superAdminCount <= 1) {
        throw new AdminActionError(
          'At least one super admin must remain.',
          409
        );
      }
    }

    await setAdminSuperStatus(targetAdminId, isSuperAdmin, client);
    const updatedTargetAdmin = await getAdminAuthById(targetAdminId, client);
    if (!updatedTargetAdmin) {
      throw new AdminActionError('Admin not found.', 404);
    }
    return updatedTargetAdmin;
  });
}

export async function removeAdminUserWithGuards({
  actingAdminId,
  targetAdminId,
}: {
  actingAdminId: number;
  targetAdminId: number;
}) {
  return withTransaction(async (client) => {
    const actingAdmin = await getAdminAuthById(actingAdminId, client);
    if (!actingAdmin) {
      throw new AdminActionError('Unauthorized.', 401);
    }
    if (!actingAdmin.is_super_admin) {
      throw new AdminActionError('Only super admins can remove admins.', 403);
    }
    if (actingAdmin.id === targetAdminId) {
      throw new AdminActionError('You cannot remove your own account.', 400);
    }

    const targetAdmin = await getAdminAuthById(targetAdminId, client);
    if (!targetAdmin) {
      throw new AdminActionError('Admin not found.', 404);
    }
    if (targetAdmin.is_super_admin) {
      const superAdminCount = await countSuperAdmins(client);
      if (superAdminCount <= 1) {
        throw new AdminActionError(
          'At least one super admin must remain.',
          409
        );
      }
    }

    await reassignAdminConfigUpdater(targetAdminId, actingAdminId, client);
    await deleteAdminUserById(targetAdminId, client);
  });
}

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
