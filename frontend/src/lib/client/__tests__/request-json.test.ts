import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import { z } from 'zod';
import { requestJson } from '../request-json';

const schema = z.object({ updatedAt: z.coerce.date() });
const options = { schema, errorMessage: 'Request failed.' };

describe('requestJson', () => {
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns schema output rather than unvalidated JSON', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ updatedAt: '2026-09-12T09:00:00.000Z', extra: true })
    );

    expect(await requestJson('/api/example', options)).toEqual({
      updatedAt: new Date('2026-09-12T09:00:00.000Z'),
    });
  });

  it.each([
    Response.json({ updatedAt: 'invalid' }),
    new Response('not JSON'),
    Response.json(null),
  ])('rejects malformed successful responses', async (response) => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(response);

    await expect(requestJson('/api/example', options)).rejects.toThrow(
      'Invalid response from server.'
    );
  });

  it('uses the server message before validating the success schema', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ message: 'Access denied.' }, { status: 403 })
    );

    await expect(requestJson('/api/example', options)).rejects.toThrow(
      'Access denied.'
    );
  });

  it.each([
    new Response('<html>Unavailable</html>', { status: 503 }),
    Response.json({ message: { detail: 'Unavailable' } }, { status: 503 }),
    Response.json(null, { status: 503 }),
  ])(
    'uses the fallback when an error has no valid message',
    async (response) => {
      fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(response);

      await expect(requestJson('/api/example', options)).rejects.toThrow(
        'Request failed.'
      );
    }
  );

  it('preserves network errors', async () => {
    const error = new TypeError('Network unavailable');
    fetchSpy = spyOn(globalThis, 'fetch').mockRejectedValue(error);

    await expect(requestJson('/api/example', options)).rejects.toBe(error);
  });
});
