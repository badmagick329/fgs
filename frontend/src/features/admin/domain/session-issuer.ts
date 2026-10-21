import {
  AccessTokenPayload,
  IssuedTokens,
  RefreshTokenRow,
  RefreshedTokens,
} from '@/features/admin/domain/auth';
import { IAdminRepository, IToken } from '@/features/admin/domain/interfaces';

/**
 * How long a token rotated away still counts as its session's. An admin page
 * fires several API calls at once, and after the access token expires each
 * one refreshes the same token; the stragglers are the browser, not a thief.
 */
export const ROTATION_GRACE_MS = 30 * 1000;

export class SessionIssuer {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly tokenService: IToken
  ) {}

  async issueAdminSession(admin: {
    id: number;
    email: string;
  }): Promise<IssuedTokens> {
    const refreshToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const tokenRow = await this.adminRepository.createRefreshToken(
      admin.id,
      tokenHash,
      this.tokenService.refreshTokenExpiresAt()
    );

    const accessToken = await this.tokenService.signAccessToken({
      sub: String(admin.id),
      email: admin.email,
      sid: tokenRow.id,
    });

    return { accessToken, refreshToken };
  }

  async refreshSession(refreshToken: string): Promise<RefreshedTokens | null> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const tokenRow =
      await this.adminRepository.getRefreshTokenByHash(tokenHash);
    if (!tokenRow) {
      return null;
    }

    if (tokenRow.revoked_at) {
      if (this.wasJustRotated(tokenRow)) {
        return this.accessForReplacement(tokenRow.id);
      }
      // Revoked by logout or revoke-all, or rotated long ago: whoever holds
      // it is replaying a stolen token, so end every session of the admin.
      await this.adminRepository.revokeAllRefreshTokensForUser(
        tokenRow.admin_user_id
      );
      return null;
    }

    const expiresAt = new Date(tokenRow.expires_at);
    if (
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenHash = this.tokenService.hashRefreshToken(newRefreshToken);

    const newToken = await this.adminRepository.rotateRefreshToken(
      tokenRow.id,
      tokenRow.admin_user_id,
      newTokenHash,
      this.tokenService.refreshTokenExpiresAt()
    );
    // A concurrent request rotated it between our read and our update.
    if (!newToken) {
      return this.accessForReplacement(tokenRow.id);
    }

    const admin = await this.adminRepository.getAdminById(
      newToken.admin_user_id
    );
    if (!admin) {
      await this.adminRepository.revokeAllRefreshTokensForUser(
        newToken.admin_user_id
      );
      return null;
    }

    const accessToken = await this.tokenService.signAccessToken({
      sub: String(newToken.admin_user_id),
      email: admin.email,
      sid: newToken.id,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /** Whether the access token's session survives logout, revocation and admin removal. */
  async isSessionActive(payload: AccessTokenPayload): Promise<boolean> {
    const adminId = Number(payload.sub);
    if (!Number.isInteger(adminId) || adminId <= 0) {
      return false;
    }
    const tip = await this.adminRepository.getLiveSessionTip(payload.sid);
    return tip?.admin_user_id === adminId;
  }

  async revokeRefreshTokenFromRawToken(rawRefreshToken: string) {
    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const tokenRow =
      await this.adminRepository.getRefreshTokenByHash(tokenHash);
    if (tokenRow && !tokenRow.revoked_at) {
      await this.adminRepository.revokeRefreshToken(tokenRow.id);
    }
  }

  private wasJustRotated(tokenRow: RefreshTokenRow) {
    if (tokenRow.replaced_by_token_id === null || !tokenRow.revoked_at) {
      return false;
    }
    const revokedAtMs = new Date(tokenRow.revoked_at).getTime();
    return Date.now() - revokedAtMs < ROTATION_GRACE_MS;
  }

  /**
   * An access token for the session that a concurrent request rotated, with
   * no refresh token: the winner's response carries the new refresh cookie,
   * and overwriting or clearing it here would log the admin out.
   */
  private async accessForReplacement(
    tokenId: number
  ): Promise<RefreshedTokens | null> {
    const tip = await this.adminRepository.getLiveSessionTip(tokenId);
    if (!tip) {
      return null;
    }
    const admin = await this.adminRepository.getAdminById(tip.admin_user_id);
    if (!admin) {
      return null;
    }

    const accessToken = await this.tokenService.signAccessToken({
      sub: String(tip.admin_user_id),
      email: admin.email,
      sid: tip.id,
    });
    return { accessToken };
  }
}
