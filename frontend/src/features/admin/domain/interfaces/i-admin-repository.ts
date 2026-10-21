import {
  AdminAuthUser,
  AdminConfigRow,
  AdminUser,
  AdminUserListRow,
  RefreshTokenRow,
} from '@/features/admin/domain/auth';
import { IAdminRepositoryTransaction } from '@/features/admin/domain/interfaces/i-admin-repository-transaction';

export interface IAdminRepository {
  countAdmins(): Promise<number>;
  createAdminUser(
    email: string,
    passwordHash: string,
    isSuperAdmin?: boolean
  ): Promise<AdminUser>;
  /**
   * Creates a super admin only while no admin exists, atomically across
   * concurrent callers. Null when an admin already exists.
   */
  createFirstAdminUser(
    email: string,
    passwordHash: string
  ): Promise<AdminUser | null>;
  getAdminByEmail(email: string): Promise<AdminUser | null>;
  getAdminById(id: number): Promise<AdminUser | null>;
  getAdminAuthById(id: number): Promise<AdminAuthUser | null>;
  updateAdminPassword(id: number, passwordHash: string): Promise<void>;
  listAdminUsers(): Promise<AdminUserListRow[]>;
  countSuperAdmins(): Promise<number>;
  setAdminSuperStatus(adminId: number, isSuperAdmin: boolean): Promise<boolean>;
  deleteAdminUserById(adminId: number): Promise<boolean>;
  reassignAdminConfigUpdater(
    fromAdminId: number,
    toAdminId: number
  ): Promise<void>;
  getAdminConfig(): Promise<AdminConfigRow | null>;
  upsertAdminConfig(
    notificationEmail: string,
    updatedByAdminUserId: number
  ): Promise<AdminConfigRow>;
  setRegistrationDiscordNotificationsEnabled(
    enabled: boolean,
    updatedByAdminUserId: number
  ): Promise<AdminConfigRow | null>;
  getRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRow | null>;
  createRefreshToken(
    adminUserId: number,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshTokenRow>;
  /** Null when the old token was already revoked, e.g. by a concurrent rotation. */
  rotateRefreshToken(
    oldTokenId: number,
    adminUserId: number,
    newTokenHash: string,
    expiresAt: Date
  ): Promise<RefreshTokenRow | null>;
  /**
   * The newest token in `refreshTokenId`'s rotation chain, if the session is
   * still live: that token is unrevoked and unexpired, and its admin exists.
   */
  getLiveSessionTip(refreshTokenId: number): Promise<RefreshTokenRow | null>;
  revokeRefreshToken(id: number): Promise<void>;
  revokeAllRefreshTokensForUser(adminUserId: number): Promise<void>;
  withTransaction<T>(
    work: (tx: IAdminRepositoryTransaction) => Promise<T>
  ): Promise<T>;
}
