import type { EmailConfig } from './schemas';

export type NotificationResult = 'success' | 'fail' | 'missing_email';
export interface INotificationSender {
  send(data: Notification): Promise<NotificationResult>;
}

export interface IUserRepository {
  getPending(): Promise<Result<Registration[], string>>;

  setFailedStatus(
    ids: number[]
  ): Promise<
    Result<
      { message: string; ids: number[] },
      { message: string; ids: number[] }
    >
  >;

  setSuccessStatus(
    ids: number[]
  ): Promise<
    Result<
      { message: string; ids: number[] },
      { message: string; ids: number[] }
    >
  >;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogLevelNumber = 0 | 1 | 2 | 3;
export interface Logger {
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
}
export type LoggerFactory = (source: string) => Logger;

export type Result<S, F> = Success<S> | Failure<F>;

export type Success<S> = {
  ok: true;
  data: S;
};
export type Failure<F> = {
  ok: false;
  error: F;
};

// email related types
export type status = 'success' | 'pending' | 'failed';

export interface IConfig extends EmailConfig {}

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
