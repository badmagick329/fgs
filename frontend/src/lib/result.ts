import * as z from 'zod';

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

export const errorRecordSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  field: z.string().optional(),
});

export const resultSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.union([
    z.object({
      ok: z.literal(true),
      data,
    }),
    z.object({
      ok: z.literal(false),
      message: z.string(),
      errors: z.array(errorRecordSchema).optional(),
    }),
  ]);
