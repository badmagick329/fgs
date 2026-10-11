import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';

mock.module('server-only', () => ({}));
const { TurnstileVerifier } = await import('@/lib/server/turnstile-verifier');

describe('TurnstileVerifier', () => {
  const verifier = new TurnstileVerifier('secret-key');
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;
  const reply = (body: unknown, status = 200) => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json(body, { status })
    );
  };

  afterEach(() => {
    fetchSpy?.mockRestore();
    mock.restore();
  });

  it('passes a token siteverify accepts, sending the secret and client IP', async () => {
    reply({ success: true, 'error-codes': [] });

    expect(await verifier.verify('token', '203.0.113.7')).toBe('passed');

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/turnstile/v0/siteverify');
    const form = init?.body as URLSearchParams;
    expect(form.get('secret')).toBe('secret-key');
    expect(form.get('response')).toBe('token');
    expect(form.get('remoteip')).toBe('203.0.113.7');
  });

  it('leaves out an unknown client IP', async () => {
    reply({ success: true });

    await verifier.verify('token', 'unknown');

    const form = fetchSpy.mock.calls[0][1]?.body as URLSearchParams;
    expect(form.has('remoteip')).toBe(false);
  });

  it('fails a rejected token, and an empty one without asking Cloudflare', async () => {
    reply({ success: false, 'error-codes': ['timeout-or-duplicate'] });

    expect(await verifier.verify('token', '203.0.113.7')).toBe('failed');
    expect(await verifier.verify('', '203.0.113.7')).toBe('failed');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('is unavailable when the check itself breaks, not the visitor', async () => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

    reply({ success: false, 'error-codes': ['invalid-input-secret'] });
    expect(await verifier.verify('token', '203.0.113.7')).toBe('unavailable');
    fetchSpy.mockRestore();

    reply({ error: 'oops' }, 500);
    expect(await verifier.verify('token', '203.0.113.7')).toBe('unavailable');
    fetchSpy.mockRestore();

    fetchSpy = spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('fetch failed')
    );
    expect(await verifier.verify('token', '203.0.113.7')).toBe('unavailable');

    errorSpy.mockRestore();
  });
});
