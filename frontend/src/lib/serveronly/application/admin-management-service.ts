import {
  IAdminRepository,
  IPasswordHasher,
} from '@/lib/serveronly/domain/interfaces';
import { SuperAdminPolicy } from '@/lib/serveronly/domain/super-admin-policy';

export class AdminManagementService {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly adminUserService: SuperAdminPolicy
  ) {}

  async countAdmins() {
    return this.adminRepository.countAdmins();
  }

  async getAdminConfig() {
    return this.adminRepository.getAdminConfig();
  }

  async upsertAdminConfig(notificationEmail: string, updatedByAdminUserId: number) {
    return this.adminRepository.upsertAdminConfig(
      notificationEmail,
      updatedByAdminUserId
    );
  }

  async getSessionAdmin(input: { adminId: number }) {
    return this.adminRepository.getAdminAuthById(input.adminId);
  }

  async listAdminsView(input: { currentAdminId: number }) {
    const currentAdmin = await this.adminRepository.getAdminAuthById(
      input.currentAdminId
    );
    if (!currentAdmin) {
      return { ok: false as const, unauthorized: true as const };
    }

    const admins = await this.adminRepository.listAdminUsers();

    return {
      ok: true as const,
      data: {
        currentAdminId: input.currentAdminId,
        currentAdminEmail: currentAdmin.email,
        currentAdminIsSuperAdmin: currentAdmin.is_super_admin,
        admins: admins.map((admin) => ({
          id: admin.id,
          email: admin.email,
          created_at: admin.created_at.toISOString(),
          is_super_admin: admin.is_super_admin,
        })),
      },
    };
  }

  async createAdminWithGuard(input: {
    actingAdminId: number;
    email: string;
    password: string;
  }) {
    const actingAdmin = await this.adminRepository.getAdminAuthById(
      input.actingAdminId
    );
    if (!actingAdmin?.is_super_admin) {
      return {
        ok: false as const,
        status: 403,
        message: 'Only super admins can create admins.',
      };
    }

    try {
      const passwordHash = await this.passwordHasher.hashPassword(input.password);
      await this.adminRepository.createAdminUser(input.email, passwordHash);
      return { ok: true as const };
    } catch {
      return {
        ok: false as const,
        status: 400,
        message: 'Unable to create admin.',
      };
    }
  }

  async updateAdminSuperStatusWithGuards(input: {
    actingAdminId: number;
    targetAdminId: number;
    isSuperAdmin: boolean;
  }) {
    return this.adminUserService.updateAdminSuperStatusWithGuards(input);
  }

  async removeAdminUserWithGuards(input: {
    actingAdminId: number;
    targetAdminId: number;
  }) {
    return this.adminUserService.removeAdminUserWithGuards(input);
  }

  async changePassword(input: {
    adminId: number;
    currentPassword: string;
    newPassword: string;
  }) {
    const admin = await this.adminRepository.getAdminById(input.adminId);
    if (!admin) {
      return { ok: false as const, status: 401, message: 'Unauthorized.' };
    }

    const isValid = await this.passwordHasher.verifyPassword(
      input.currentPassword,
      admin.password_hash
    );

    if (!isValid) {
      return {
        ok: false as const,
        status: 400,
        message: 'Current password is incorrect.',
      };
    }

    const passwordHash = await this.passwordHasher.hashPassword(input.newPassword);
    await this.adminRepository.updateAdminPassword(input.adminId, passwordHash);
    await this.adminRepository.revokeAllRefreshTokensForUser(input.adminId);

    return { ok: true as const };
  }
}


