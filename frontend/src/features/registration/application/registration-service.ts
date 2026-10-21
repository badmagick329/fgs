import { IRegistrationRepository } from '@/features/registration/domain/i-registration-repository';
import {
  EmailWorkerStatus,
  REGISTRATIONS_PAGE_SIZE,
  Registration,
  RegistrationPage,
} from '@/features/registration/domain/registration';
import { Result } from '@/lib/result';
import { INotifier } from '@/lib/server/i-notifier';

export class RegistrationService {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
    private readonly notifier: INotifier
  ) {}

  async getRegistrations(page: number): Promise<Result<RegistrationPage>> {
    return this.registrationRepository.getRegistrations({
      page,
      pageSize: REGISTRATIONS_PAGE_SIZE,
    });
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
