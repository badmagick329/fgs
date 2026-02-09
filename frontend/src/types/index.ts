import * as z from 'zod';

export const registrationSchema = z.object({
  id: z.number().positive(),
  first_name: z.string().trim().nonempty({ error: 'First name is required' }),
  last_name: z.string().trim().nonempty({ error: 'Last name is required' }),
  email: z.email({ error: 'Invalid email address' }),
  registration_message: z.string().nullable(),
  registered_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
  email_status: z.enum(['pending', 'success', 'failed']),
  retry_count: z.number().nonnegative(),
});

export const registrationListSchema = z.array(registrationSchema);

export type Registration = z.infer<typeof registrationSchema>;

export const createRegistrationSchema = z.object({
  firstName: z.string().trim().nonempty({ error: 'First name is required' }),
  lastName: z.string().trim().nonempty({ error: 'Last name is required' }),
  email: z.email({ error: 'Invalid email address' }),
});

export type CreateRegistration = z.infer<typeof createRegistrationSchema>;

export const adminCredentialsSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z.string().min(8, { error: 'Password must be at least 8 characters' }),
});

export type AdminCredentials = z.infer<typeof adminCredentialsSchema>;

export const adminPasswordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters' }),
  newPassword: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters' }),
});

export type AdminPasswordChange = z.infer<typeof adminPasswordChangeSchema>;

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

export const registrationResultSchema = resultSchema(registrationSchema);
export const registrationListResultSchema = resultSchema(
  registrationListSchema
);
