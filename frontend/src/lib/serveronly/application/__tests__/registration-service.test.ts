import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { RegistrationService } from '@/lib/serveronly/application/registration-service';
import {
  createNotifierMock,
  createRegistrationRepositoryMock,
} from '@/test/mock-factories';

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
      firstName: 'a',
      lastName: 'b',
      email: 'a@b.com',
    });

    expect(repo.createRegistration).toHaveBeenCalledWith({
      firstName: 'a',
      lastName: 'b',
      email: 'a@b.com',
    });
  });

  it('delegates notifier', async () => {
    const repo = createRegistrationRepositoryMock();
    const notifier = createNotifierMock();
    const service = new RegistrationService(repo, notifier);

    await service.notifyDiscord({ source: 'x', message: 'y' });

    expect(notifier.sendMessage).toHaveBeenCalledWith({ source: 'x', message: 'y' });
  });
});
