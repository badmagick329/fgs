import { type Notification, type Registration, type Result } from '.';

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
