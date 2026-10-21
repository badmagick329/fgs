import {
  REGISTRATION_CAMPUSES,
  isValidRegistrationAppointment,
  normalizeRegistrationCampus,
} from '@/features/registration/domain/registration-rules';
import * as z from 'zod';
import { resultSchema } from '@/lib/result';

export const registrationCampusSchema = z.enum(REGISTRATION_CAMPUSES);

const storedRegistrationCampusSchema = z.preprocess(
  normalizeRegistrationCampus,
  registrationCampusSchema
);

export const registrationSchema = z.object({
  id: z.number().positive(),
  student_name: z
    .string()
    .trim()
    .nonempty({ error: 'Student name is required' }),
  parent_name: z.string().trim().nonempty({ error: 'Parent name is required' }),
  class_name: z.string().trim().nonempty({ error: 'Class is required' }),
  mobile_number: z
    .string()
    .trim()
    .nonempty({ error: 'Mobile number is required' }),
  campus: storedRegistrationCampusSchema,
  preferred_appointment_at: z.coerce.date(),
  registration_message: z.string().nullable(),
  registered_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
  email_status: z.enum(['pending', 'success', 'failed']),
  retry_count: z.number().nonnegative(),
});

export const registrationListSchema = z.array(registrationSchema);

export type Registration = z.infer<typeof registrationSchema>;

export const REGISTRATIONS_PAGE_SIZE = 50;
// Caps the OFFSET an admin request can ask Postgres to skip; far beyond any
// real backlog at 50 rows a page.
export const REGISTRATIONS_MAX_PAGE = 10_000;

/** 1-based page number from the listing's `?page=` query parameter. */
export const registrationPageNumberSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(REGISTRATIONS_MAX_PAGE);

export const registrationPageSchema = z.object({
  registrations: registrationListSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  hasNextPage: z.boolean(),
});

export type RegistrationPage = z.infer<typeof registrationPageSchema>;

export const emailWorkerStatusSchema = z.object({
  id: z.literal(1),
  last_started_at: z.coerce.date().nullable(),
  last_finished_at: z.coerce.date().nullable(),
  next_run_at: z.coerce.date().nullable(),
  updated_at: z.coerce.date(),
});

export type EmailWorkerStatus = z.infer<typeof emailWorkerStatusSchema>;

// The columns are unbounded TEXT, so these caps are what stops a public
// submitter from storing (and mailing to the school) arbitrarily large values.
export const REGISTRATION_NAME_MAX_LENGTH = 120;
export const REGISTRATION_CLASS_MAX_LENGTH = 40;
const HONEYPOT_MAX_LENGTH = 200;

export const createRegistrationSchema = z.object({
  studentName: z
    .string()
    .trim()
    .nonempty({ error: 'Student name is required' })
    .max(REGISTRATION_NAME_MAX_LENGTH, { error: 'Student name is too long' }),
  parentName: z
    .string()
    .trim()
    .nonempty({ error: 'Parent name is required' })
    .max(REGISTRATION_NAME_MAX_LENGTH, { error: 'Parent name is too long' }),
  className: z
    .string()
    .trim()
    .nonempty({ error: 'Class is required' })
    .max(REGISTRATION_CLASS_MAX_LENGTH, { error: 'Class is too long' }),
  mobileNumber: z
    .string()
    .trim()
    .nonempty({ error: 'Mobile number is required' })
    .regex(/^03\d{9}$/, {
      error: 'Enter a valid mobile number in the format 03XXXXXXXXX.',
    }),
  campus: registrationCampusSchema,
  preferredAppointmentAt: z
    .string()
    .trim()
    .nonempty({ error: 'Preferred appointment is required' })
    .refine(isValidRegistrationAppointment, {
      error: 'Select a valid appointment date and time.',
    }),
  honeypot: z.string().max(HONEYPOT_MAX_LENGTH).optional(),
  formStartedAt: z.number().finite().optional(),
});

export type CreateRegistration = z.infer<typeof createRegistrationSchema>;

export const registrationResultSchema = resultSchema(registrationSchema);
export const registrationPageResultSchema = resultSchema(
  registrationPageSchema
);
export const emailWorkerStatusResultSchema = resultSchema(
  emailWorkerStatusSchema.nullable()
);
