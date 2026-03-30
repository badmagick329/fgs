import { EmailWorkerStatus, Registration } from '@/types';
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

  async getEmailWorkerStatus(): Promise<Result<EmailWorkerStatus | null>> {
    return this.registrationRepository.getEmailWorkerStatus();
  }

  async createRegistration(input: {
    studentName: string;
    parentName: string;
    className: string;
    mobileNumber: string;
    campus: string;
    preferredAppointmentAt: string;
  }): Promise<Result<Registration>> {
    return this.registrationRepository.createRegistration(input);
  }

  notifyDiscord(input: { source: string; message: string }) {
    return this.notifier.sendMessage(input);
  }
}
