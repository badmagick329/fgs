import type { EmailConfig } from '@/domain/schemas';

export type status = 'success' | 'pending' | 'failed';

export interface IConfig {
  read(): EmailConfig;
}

export interface IdResult {
  id: number;
}

export type Registration = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  registration_message: string;
  registered_at: string;
  updated_at: string | null;
  email_status: status;
  retry_count: number;
};
export interface Notification {
  payload: Registration[];
}

export type Result<S, F> = Success<S> | Failure<F>;

export type Success<S> = {
  ok: true;
  data: S;
};
export type Failure<F> = {
  ok: false;
  error: F;
};
