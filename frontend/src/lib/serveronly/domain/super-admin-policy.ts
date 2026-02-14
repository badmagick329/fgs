import { AdminActionError } from '@/types/auth';
import { IAdminRepository } from '@/lib/serveronly/domain/interfaces';

export class SuperAdminPolicy {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async updateAdminSuperStatusWithGuards(input: {
    actingAdminId: number;
    targetAdminId: number;
    isSuperAdmin: boolean;
  }) {
    const { actingAdminId, targetAdminId, isSuperAdmin } = input;

    return this.adminRepository.withTransaction(async (tx) => {
      const actingAdmin = await tx.getAdminAuthById(actingAdminId);
      if (!actingAdmin) {
        throw new AdminActionError('Unauthorized.', 401);
      }

      if (!actingAdmin.is_super_admin) {
        throw new AdminActionError(
          'Only super admins can change admin roles.',
          403
        );
      }

      const targetAdmin = await tx.getAdminAuthById(targetAdminId);
      if (!targetAdmin) {
        throw new AdminActionError('Admin not found.', 404);
      }

      if (targetAdmin.is_super_admin === isSuperAdmin) {
        return targetAdmin;
      }

      if (targetAdmin.is_super_admin && !isSuperAdmin) {
        const superAdminCount = await tx.countSuperAdmins();
        if (superAdminCount <= 1) {
          throw new AdminActionError('At least one super admin must remain.', 409);
        }
      }

      await tx.setAdminSuperStatus(targetAdminId, isSuperAdmin);
      const updatedTargetAdmin = await tx.getAdminAuthById(targetAdminId);
      if (!updatedTargetAdmin) {
        throw new AdminActionError('Admin not found.', 404);
      }

      return updatedTargetAdmin;
    });
  }

  async removeAdminUserWithGuards(input: {
    actingAdminId: number;
    targetAdminId: number;
  }) {
    const { actingAdminId, targetAdminId } = input;

    await this.adminRepository.withTransaction(async (tx) => {
      const actingAdmin = await tx.getAdminAuthById(actingAdminId);
      if (!actingAdmin) {
        throw new AdminActionError('Unauthorized.', 401);
      }

      if (!actingAdmin.is_super_admin) {
        throw new AdminActionError('Only super admins can remove admins.', 403);
      }

      if (actingAdmin.id === targetAdminId) {
        throw new AdminActionError('You cannot remove your own account.', 400);
      }

      const targetAdmin = await tx.getAdminAuthById(targetAdminId);
      if (!targetAdmin) {
        throw new AdminActionError('Admin not found.', 404);
      }

      if (targetAdmin.is_super_admin) {
        const superAdminCount = await tx.countSuperAdmins();
        if (superAdminCount <= 1) {
          throw new AdminActionError('At least one super admin must remain.', 409);
        }
      }

      await tx.reassignAdminConfigUpdater(targetAdminId, actingAdminId);
      await tx.deleteAdminUserById(targetAdminId);
    });
  }
}


