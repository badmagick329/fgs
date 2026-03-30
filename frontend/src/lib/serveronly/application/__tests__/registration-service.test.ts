import {
  createNotifierMock,
  createRegistrationRepositoryMock,
} from '@/test/mock-factories';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { RegistrationService } from '@/lib/serveronly/application/registration-service';

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
      campus: 'Boys Campus',
      preferredAppointmentAt: '2026-04-01T08:00:00+05:00',
    });

    expect(repo.createRegistration).toHaveBeenCalledWith({
      studentName: 'Student',
      parentName: 'Parent',
      className: 'Class 5',
      mobileNumber: '03001234567',
      campus: 'Boys Campus',
      preferredAppointmentAt: '2026-04-01T08:00:00+05:00',
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
