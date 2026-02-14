import { Result } from '@/lib/result';
import { Registration } from '@/types';

export interface IRegistrationRepository {
  getRegistrations(): Promise<Result<Registration[]>>;
  createRegistration(input: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<Result<Registration>>;
}
