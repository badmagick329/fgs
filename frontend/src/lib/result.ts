import type { z } from 'zod';

export type Result<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
      errors?: ErrorRecord[];
    };

export type ErrorRecord = {
  message: string;
  code?: string;
  field?: string;
};

export function errorsFromZod(error: z.ZodError): ErrorRecord[] {
  return error.issues.map((issue) => ({
    message: issue.message,
    code: issue.code,
    field: issue.path.length ? issue.path.join('.') : undefined,
  }));
}
