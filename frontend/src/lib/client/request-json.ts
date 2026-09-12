import { z } from 'zod';

const errorResponseSchema = z.object({ message: z.string() });

type JsonRequestOptions<T> = RequestInit & {
  schema: z.ZodType<T>;
  errorMessage: string | ((status: number, message?: string) => string);
};

/** Keeps untrusted response parsing out of UI state and query callbacks. */
export async function requestJson<T>(
  url: string,
  { schema, errorMessage, ...init }: JsonRequestOptions<T>
): Promise<T> {
  const response = await fetch(url, init);
  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = errorResponseSchema.safeParse(json);
    const message = parsedError.success ? parsedError.data.message : undefined;
    throw new Error(
      typeof errorMessage === 'function'
        ? errorMessage(response.status, message)
        : (message ?? errorMessage)
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Invalid response from server.');
  }

  return parsed.data;
}
