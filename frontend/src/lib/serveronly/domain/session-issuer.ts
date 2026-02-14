import { IAdminRepository, IToken } from '@/lib/serveronly/domain/interfaces';
import { RefreshedTokens } from '@/types/auth';

export class SessionIssuer {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly tokenService: IToken
  ) {}

  async issueAdminSession(admin: { id: number; email: string }) {
    const refreshToken = this.tokenService.generateRefreshToken();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    await this.adminRepository.createRefreshToken(
      admin.id,
      tokenHash,
      this.tokenService.refreshTokenExpiresAt()
    );

    const accessToken = await this.tokenService.signAccessToken({
      sub: String(admin.id),
      email: admin.email,
    });

    return { accessToken, refreshToken };
  }

  async refreshSession(refreshToken: string): Promise<RefreshedTokens | null> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const tokenRow = await this.adminRepository.getRefreshTokenByHash(tokenHash);
    if (!tokenRow) {
      return null;
    }

    if (tokenRow.revoked_at) {
      await this.adminRepository.revokeAllRefreshTokensForUser(
        tokenRow.admin_user_id
      );
      return null;
    }

    const expiresAt = new Date(tokenRow.expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
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

    const admin = await this.adminRepository.getAdminById(newToken.admin_user_id);
    if (!admin) {
      await this.adminRepository.revokeAllRefreshTokensForUser(
        newToken.admin_user_id
      );
      return null;
    }

    const accessToken = await this.tokenService.signAccessToken({
      sub: String(newToken.admin_user_id),
      email: admin.email,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revokeRefreshTokenFromRawToken(rawRefreshToken: string) {
    const tokenHash = this.tokenService.hashRefreshToken(rawRefreshToken);
    const tokenRow = await this.adminRepository.getRefreshTokenByHash(tokenHash);
    if (tokenRow && !tokenRow.revoked_at) {
      await this.adminRepository.revokeRefreshToken(tokenRow.id);
    }
  }
}


