import { Registration } from '@/types';
import { Result } from '@/lib/result';
import {
  INotifier,
  IRegistrationRepository,
} from '@/lib/serveronly/domain/interfaces';

export class RegistrationService {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
    private readonly notifier: INotifier
  ) {}

  async getRegistrations() {
    return this.registrationRepository.getRegistrations();
  }

  async createRegistration(input: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<Result<Registration>> {
    return this.registrationRepository.createRegistration(input);
  }

  notifyDiscord(input: { source: string; message: string }) {
    return this.notifier.sendMessage(input);
  }
}


