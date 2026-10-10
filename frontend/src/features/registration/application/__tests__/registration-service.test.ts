import { RegistrationService } from '@/features/registration/application/registration-service';
import {
  createNotifierMock,
  createRegistrationRepositoryMock,
} from '@/test/mock-factories';
import { createFutureRegistrationAppointmentAt } from '@/test/registration-test-utils';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

describe('RegistrationService', () => {
  beforeEach(() => {
    mock.restore();
  });

  it('delegates getRegistrations', async () => {
    const repo = createRegistrationRepositoryMock();
    const notifier = createNotifierMock();
    const service = new RegistrationService(repo, notifier);

    await service.getRegistrations();

    expect(repo.getRegistrations).toHaveBeenCalled();
  });

  it('delegates createRegistration', async () => {
    const repo = createRegistrationRepositoryMock();
    const notifier = createNotifierMock();
    const service = new RegistrationService(repo, notifier);

    await service.createRegistration({
      studentName: 'Student',
      parentName: 'Parent',
      className: 'Class 5',
      mobileNumber: '03001234567',
      campus: 'FGS Ravi Road Boys Campus',
      preferredAppointmentAt: createFutureRegistrationAppointmentAt(),
    });

    expect(repo.createRegistration).toHaveBeenCalledWith({
      studentName: 'Student',
      parentName: 'Parent',
      className: 'Class 5',
      mobileNumber: '03001234567',
      campus: 'FGS Ravi Road Boys Campus',
      preferredAppointmentAt: createFutureRegistrationAppointmentAt(),
    });
  });

  it('delegates notifier', async () => {
    const repo = createRegistrationRepositoryMock();
    const notifier = createNotifierMock();
    const service = new RegistrationService(repo, notifier);

    await service.notifyDiscord({ source: 'x', message: 'y' });

    expect(notifier.sendMessage).toHaveBeenCalledWith({
      source: 'x',
      message: 'y',
    });
  });
});
