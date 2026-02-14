import { type Notification, type Registration, type Result } from '.';

export interface INotificationSender {
  send(data: Notification): Promise<Result<{ providerId: string }, string>>;
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
