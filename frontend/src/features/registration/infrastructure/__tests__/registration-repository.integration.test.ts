import {
  acquireGlobalTestDbLock,
  closePool,
  createTestPool,
  ensureSchema,
  releaseGlobalTestDbLock,
  resetTables,
} from '@/test/db-test-utils';
import { createFutureRegistrationAppointmentAt } from '@/test/registration-test-utils';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from 'bun:test';
import { PoolClient } from 'pg';

mock.module('server-only', () => ({}));

describe('RegistrationRepository integration', () => {
  const pool = createTestPool();
  let repo: any;
  let lockClient: PoolClient;

  beforeAll(async () => {
    const { RegistrationRepository } =
      await import('@/features/registration/infrastructure/registration-repository');
    repo = new RegistrationRepository(pool);
    lockClient = (await acquireGlobalTestDbLock(pool)) as PoolClient;
    await ensureSchema(pool);
  });

  beforeEach(async () => {
    await resetTables(pool);
  });

  afterAll(async () => {
    await releaseGlobalTestDbLock(lockClient);
    await closePool(pool);
  });

  it('creates registration and lists registrations', async () => {
    const create = await repo.createRegistration({
      studentName: 'A',
      parentName: 'B',
      className: 'Class 5',
      mobileNumber: '03001234567',
      campus: 'FGS Ravi Road Boys Campus',
      preferredAppointmentAt: createFutureRegistrationAppointmentAt(),
    });
    expect(create.ok).toBeTrue();

    const list = await repo.getRegistrations({ page: 1, pageSize: 50 });
    expect(list.ok).toBeTrue();
    if (list.ok) expect(list.data.registrations.length).toBe(1);
  });

  it('normalizes legacy campus values when listing registrations', async () => {
    await pool.query(`
      INSERT INTO registration_requests (
        student_name, parent_name, class_name, mobile_number, campus,
        preferred_appointment_at, registered_at, email_status, retry_count
      ) VALUES ('A', 'B', 'Class 5', '03001234567', 'Boys Campus', NOW(), NOW(), 'pending', 0)
    `);

    const list = await repo.getRegistrations({ page: 1, pageSize: 50 });
    expect(list.ok).toBeTrue();
    if (list.ok) {
      expect(list.data.registrations[0]?.campus).toBe(
        'FGS Ravi Road Boys Campus'
      );
    }
  });

  it('pages newest-first with a bounded row count and a next-page flag', async () => {
    // Same registered_at on two rows checks the id tiebreak keeps the order stable.
    await pool.query(`
      INSERT INTO registration_requests (
        student_name, parent_name, class_name, mobile_number, campus,
        preferred_appointment_at, registered_at
      ) VALUES
        ('Oldest', 'P', 'Class 5', '03001234567', 'FGS Ravi Road Boys Campus', NOW(), NOW() - INTERVAL '2 days'),
        ('Middle', 'P', 'Class 5', '03001234567', 'FGS Ravi Road Boys Campus', NOW(), NOW() - INTERVAL '1 day'),
        ('NewestA', 'P', 'Class 5', '03001234567', 'FGS Ravi Road Boys Campus', NOW(), '2030-01-01T00:00:00Z'),
        ('NewestB', 'P', 'Class 5', '03001234567', 'FGS Ravi Road Boys Campus', NOW(), '2030-01-01T00:00:00Z'),
        ('Middle2', 'P', 'Class 5', '03001234567', 'FGS Ravi Road Boys Campus', NOW(), NOW() - INTERVAL '1 hour')
    `);

    const names = (r: {
      data: { registrations: { student_name: string }[] };
    }) => r.data.registrations.map((row) => row.student_name);

    const first = await repo.getRegistrations({ page: 1, pageSize: 2 });
    const second = await repo.getRegistrations({ page: 2, pageSize: 2 });
    const third = await repo.getRegistrations({ page: 3, pageSize: 2 });
    const beyond = await repo.getRegistrations({ page: 4, pageSize: 2 });

    expect(names(first)).toEqual(['NewestB', 'NewestA']);
    expect(first.data.hasNextPage).toBeTrue();
    expect(names(second)).toEqual(['Middle2', 'Middle']);
    expect(second.data.hasNextPage).toBeTrue();
    expect(names(third)).toEqual(['Oldest']);
    expect(third.data.hasNextPage).toBeFalse();
    expect(names(beyond)).toEqual([]);
    expect(beyond.data).toMatchObject({
      page: 4,
      pageSize: 2,
      hasNextPage: false,
    });
  });

  it('returns parse errors when row shape invalid', async () => {
    await pool.query(`
      INSERT INTO registration_requests (
        student_name,
        parent_name,
        class_name,
        mobile_number,
        campus,
        preferred_appointment_at,
        registered_at,
        email_status,
        retry_count
      ) VALUES ('A', 'B', '', '03001234567', 'Invalid Campus', NOW(), NOW(), 'pending', 0)
    `);

    const list = await repo.getRegistrations({ page: 1, pageSize: 50 });
    expect(list.ok).toBeFalse();
  });
});
