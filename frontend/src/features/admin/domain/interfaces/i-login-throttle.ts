/** Who a login attempt counts against: the account and the caller's address. */
export type LoginAttemptKeys = {
  /** Normalised (trimmed, lower-case) email. */
  email: string;
  ip: string;
};

export interface ILoginThrottle {
  /** Seconds until these keys may try again; 0 when neither is cooling down. */
  retryAfterSeconds(keys: LoginAttemptKeys): number;
  recordFailure(keys: LoginAttemptKeys): void;
  /** Clears the email's failures; the IP's stay, so one good login cannot launder a spray. */
  recordSuccess(keys: LoginAttemptKeys): void;
}
