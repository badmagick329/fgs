import 'server-only';
import * as z from 'zod';
import {
  CaptchaOutcome,
  ICaptchaVerifier,
} from '@/lib/server/i-captcha-verifier';

const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Long enough for a slow round trip, short enough that the form doesn't hang. */
const VERIFY_TIMEOUT_MS = 10_000;

/** Codes that mean our side or Cloudflare's is broken, not the visitor's answer. */
const UNAVAILABLE_ERROR_CODES = new Set([
  'missing-input-secret',
  'invalid-input-secret',
  'internal-error',
]);

const siteverifySchema = z.object({
  success: z.boolean(),
  'error-codes': z.array(z.string()).default([]),
});

/**
 * Checks a Cloudflare Turnstile token with siteverify. Each token is valid
 * once, for five minutes.
 */
export class TurnstileVerifier implements ICaptchaVerifier {
  constructor(private readonly secretKey: string) {}

  async verify(token: string, remoteIp: string): Promise<CaptchaOutcome> {
    if (!token) return 'failed';

    const form = new URLSearchParams({
      secret: this.secretKey,
      response: token,
    });
    if (remoteIp !== 'unknown') form.set('remoteip', remoteIp);

    try {
      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });
      const parsed = siteverifySchema.safeParse(
        await response.json().catch(() => null)
      );
      if (!response.ok || !parsed.success) {
        console.error('Turnstile siteverify returned', response.status);
        return 'unavailable';
      }
      if (parsed.data.success) return 'passed';

      const codes = parsed.data['error-codes'];
      if (codes.some((code) => UNAVAILABLE_ERROR_CODES.has(code))) {
        console.error('Turnstile siteverify refused our request:', codes);
        return 'unavailable';
      }
      return 'failed';
    } catch (error) {
      console.error('Turnstile siteverify failed:', error);
      return 'unavailable';
    }
  }
}
