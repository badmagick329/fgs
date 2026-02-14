import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { AdminActionError } from '@/types/auth';
import { SuperAdminPolicy } from '@/lib/serveronly/domain/super-admin-policy';
import {
  createAdminRepositoryMock,
  createAdminRepositoryTransactionMock,
} from '@/test/mock-factories';

describe('SuperAdminPolicy', () => {
  beforeEach(() => {
    mock.restore();
  });

  function withTx(tx: ReturnType<typeof createAdminRepositoryTransactionMock>) {
    return createAdminRepositoryMock({
      withTransaction: mock(async (work) => work(tx)),
    });
  }

  it('throws 401 when acting admin missing for role update', async () => {
    const tx = createAdminRepositoryTransactionMock();
    const repo = withTx(tx);
    const policy = new SuperAdminPolicy(repo);

    await expect(
      policy.updateAdminSuperStatusWithGuards({
        actingAdminId: 1,
        targetAdminId: 2,
        isSuperAdmin: true,
      })
    ).rejects.toMatchObject({ status: 401 } satisfies Partial<AdminActionError>);
  });

  it('blocks demoting last super admin', async () => {
    const tx = createAdminRepositoryTransactionMock({
      getAdminAuthById: mock(async (id: number) => {
        if (id === 1) return { id: 1, email: 'a@a.com', is_super_admin: true };
        return { id: 2, email: 'b@b.com', is_super_admin: true };
      }),
      countSuperAdmins: mock(async () => 1),
    });
    const repo = withTx(tx);
    const policy = new SuperAdminPolicy(repo);

    await expect(
      policy.updateAdminSuperStatusWithGuards({
        actingAdminId: 1,
        targetAdminId: 2,
        isSuperAdmin: false,
      })
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<AdminActionError>);
  });

  it('updates super status when allowed', async () => {
    const tx = createAdminRepositoryTransactionMock({
      getAdminAuthById: mock(async (id: number) => {
        if (id === 1) return { id: 1, email: 'a@a.com', is_super_admin: true };
        if (id === 2) return { id: 2, email: 'b@b.com', is_super_admin: false };
        return null;
      }),
    });
    const repo = withTx(tx);
    const policy = new SuperAdminPolicy(repo);

    const result = await policy.updateAdminSuperStatusWithGuards({
      actingAdminId: 1,
      targetAdminId: 2,
      isSuperAdmin: true,
    });

    expect(result.is_super_admin).toBeFalse();
    expect(tx.setAdminSuperStatus).toHaveBeenCalledWith(2, true);
  });

  it('blocks self delete', async () => {
    const tx = createAdminRepositoryTransactionMock({
      getAdminAuthById: mock(async () => ({
        id: 1,
        email: 'a@a.com',
        is_super_admin: true,
      })),
    });
    const repo = withTx(tx);
    const policy = new SuperAdminPolicy(repo);

    await expect(
      policy.removeAdminUserWithGuards({ actingAdminId: 1, targetAdminId: 1 })
    ).rejects.toMatchObject({ status: 400 } satisfies Partial<AdminActionError>);
  });

  it('removes target admin when allowed', async () => {
    const tx = createAdminRepositoryTransactionMock({
      getAdminAuthById: mock(async (id: number) => {
        if (id === 1) return { id: 1, email: 'a@a.com', is_super_admin: true };
        return { id: 2, email: 'b@b.com', is_super_admin: false };
      }),
    });
    const repo = withTx(tx);
    const policy = new SuperAdminPolicy(repo);

    await policy.removeAdminUserWithGuards({ actingAdminId: 1, targetAdminId: 2 });

    expect(tx.reassignAdminConfigUpdater).toHaveBeenCalledWith(2, 1);
    expect(tx.deleteAdminUserById).toHaveBeenCalledWith(2);
  });
});
