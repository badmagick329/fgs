import { AdminAuthUser } from '@/types/auth';

export interface IAdminRepositoryTransaction {
  getAdminAuthById(id: number): Promise<AdminAuthUser | null>;
  countSuperAdmins(): Promise<number>;
  setAdminSuperStatus(adminId: number, isSuperAdmin: boolean): Promise<boolean>;
  reassignAdminConfigUpdater(
    fromAdminId: number,
    toAdminId: number
  ): Promise<void>;
  deleteAdminUserById(adminId: number): Promise<boolean>;
}
