import { Registration } from '@/types';
import { Result } from '@/lib/result';

export interface IRegistrationRepository {
  getRegistrations(): Promise<Result<Registration[]>>;
  createRegistration(input: {
    studentName: string;
    parentName: string;
    className: string;
    mobileNumber: string;
    campus: string;
    preferredAppointmentAt: string;
  }): Promise<Result<Registration>>;
}
