/**
 * `unavailable` means the check itself could not run (provider down, bad
 * configuration), which the visitor cannot fix by trying the challenge again.
 */
export type CaptchaOutcome = 'passed' | 'failed' | 'unavailable';

export interface ICaptchaVerifier {
  verify(token: string, remoteIp: string): Promise<CaptchaOutcome>;
}
