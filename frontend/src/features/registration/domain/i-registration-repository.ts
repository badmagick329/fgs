import {
  EmailWorkerStatus,
  Registration,
  RegistrationPage,
} from '@/features/registration/domain/registration';
import { Result } from '@/lib/result';

export interface IRegistrationRepository {
  getRegistrations(input: {
    page: number;
    pageSize: number;
  }): Promise<Result<RegistrationPage>>;
  getEmailWorkerStatus(): Promise<Result<EmailWorkerStatus | null>>;
  createRegistration(input: {
    studentName: string;
    parentName: string;
    className: string;
    mobileNumber: string;
    campus: string;
    preferredAppointmentAt: string;
  }): Promise<Result<Registration>>;
}
