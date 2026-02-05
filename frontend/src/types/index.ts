import * as z from 'zod';

export const registrationSchema = z.object({
  id: z.number().positive(),
  first_name: z.string().trim().nonempty({ error: 'First name is required' }),
  last_name: z.string().trim().nonempty({ error: 'Last name is required' }),
  email: z.email({ error: 'Invalid email address' }),
  registration_message: z.string().nullable(),
  registered_at: z.date(),
  updated_at: z.date().nullable(),
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
