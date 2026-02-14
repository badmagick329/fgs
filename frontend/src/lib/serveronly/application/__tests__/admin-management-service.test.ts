import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { AdminManagementService } from '@/lib/serveronly/application/admin-management-service';
import { SuperAdminPolicy } from '@/lib/serveronly/domain/super-admin-policy';
import {
  createAdminRepositoryMock,
  createPasswordHasherMock,
} from '@/test/mock-factories';

describe('AdminManagementService', () => {
  beforeEach(() => {
    mock.restore();
  });

  function makeService(repo?: any, hasher?: any, policy?: any) {
    const repository = repo ?? createAdminRepositoryMock();
    const passwordHasher = hasher ?? createPasswordHasherMock();
    const userPolicy = policy ?? (new SuperAdminPolicy(repository) as any);
    return new AdminManagementService(repository, passwordHasher, userPolicy);
  }

  it('listAdminsView returns unauthorized when current admin missing', async () => {
    const service = makeService();
    const result = await service.listAdminsView({ currentAdminId: 9 });
    expect(result.ok).toBeFalse();
  });

  it('listAdminsView maps rows to dto', async () => {
    const repo = createAdminRepositoryMock({
      getAdminAuthById: mock(async () => ({ id: 1, email: 'a@a.com', is_super_admin: true })),
      listAdminUsers: mock(async () => [
        {
          id: 2,
          email: 'b@b.com',
          created_at: new Date('2024-01-01T00:00:00.000Z'),
          is_super_admin: false,
        },
      ]),
    });
    const service = makeService(repo);

    const result = await service.listAdminsView({ currentAdminId: 1 });

    expect(result.ok).toBeTrue();
    if (result.ok) {
      expect(result.data.admins[0].created_at).toBe('2024-01-01T00:00:00.000Z');
    }
  });

  it('create admin requires super admin', async () => {
    const repo = createAdminRepositoryMock({
      getAdminAuthById: mock(async () => ({ id: 1, email: 'a@a.com', is_super_admin: false })),
    });
    const service = makeService(repo);

    const result = await service.createAdminWithGuard({
      actingAdminId: 1,
      email: 'b@b.com',
      password: 'password',
    });

    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.status).toBe(403);
  });

  it('changePassword validates current password', async () => {
    const repo = createAdminRepositoryMock({
      getAdminById: mock(async () => ({ id: 1, email: 'a@a.com', password_hash: 'hash' })),
    });
    const hasher = createPasswordHasherMock({ verifyPassword: mock(async () => false) });
    const service = makeService(repo, hasher);

    const result = await service.changePassword({
      adminId: 1,
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.ok).toBeFalse();
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('changePassword updates hash and revokes sessions', async () => {
    const repo = createAdminRepositoryMock({
      getAdminById: mock(async () => ({ id: 1, email: 'a@a.com', password_hash: 'hash' })),
    });
    const hasher = createPasswordHasherMock({
      verifyPassword: mock(async () => true),
      hashPassword: mock(async () => 'new-hash'),
    });
    const service = makeService(repo, hasher);

    const result = await service.changePassword({
      adminId: 1,
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });

    expect(result.ok).toBeTrue();
    expect(repo.updateAdminPassword).toHaveBeenCalledWith(1, 'new-hash');
    expect(repo.revokeAllRefreshTokensForUser).toHaveBeenCalledWith(1);
  });
});
