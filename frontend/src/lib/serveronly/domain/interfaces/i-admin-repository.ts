import {
  AdminAuthUser,
  AdminConfigRow,
  AdminUser,
  AdminUserListRow,
  RefreshTokenRow,
} from '@/types/auth';
import { IAdminRepositoryTransaction } from './i-admin-repository-transaction';

export interface IAdminRepository {
  countAdmins(): Promise<number>;
  createAdminUser(
    email: string,
    passwordHash: string,
    isSuperAdmin?: boolean
  ): Promise<AdminUser>;
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
  getRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRow | null>;
  createRefreshToken(
    adminUserId: number,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshTokenRow>;
  rotateRefreshToken(
    oldTokenId: number,
    adminUserId: number,
    newTokenHash: string,
    expiresAt: Date
  ): Promise<RefreshTokenRow>;
  revokeRefreshToken(id: number): Promise<void>;
  revokeAllRefreshTokensForUser(adminUserId: number): Promise<void>;
  withTransaction<T>(
    work: (tx: IAdminRepositoryTransaction) => Promise<T>
  ): Promise<T>;
}
