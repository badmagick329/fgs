import * as z from 'zod';
import {
  REGISTRATION_CAMPUSES,
  isValidRegistrationAppointment,
} from '@/lib/registration';

export const registrationCampusSchema = z.enum(REGISTRATION_CAMPUSES);

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
  campus: registrationCampusSchema,
  preferred_appointment_at: z.coerce.date(),
  registration_message: z.string().nullable(),
  registered_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
  email_status: z.enum(['pending', 'success', 'failed']),
  retry_count: z.number().nonnegative(),
});

export const registrationListSchema = z.array(registrationSchema);

export type Registration = z.infer<typeof registrationSchema>;

export const emailWorkerStatusSchema = z.object({
  id: z.literal(1),
  last_started_at: z.coerce.date().nullable(),
  last_finished_at: z.coerce.date().nullable(),
  next_run_at: z.coerce.date().nullable(),
  updated_at: z.coerce.date(),
});

export type EmailWorkerStatus = z.infer<typeof emailWorkerStatusSchema>;

export const createRegistrationSchema = z.object({
  studentName: z
    .string()
    .trim()
    .nonempty({ error: 'Student name is required' }),
  parentName: z.string().trim().nonempty({ error: 'Parent name is required' }),
  className: z.string().trim().nonempty({ error: 'Class is required' }),
  mobileNumber: z
    .string()
    .trim()
    .nonempty({ error: 'Mobile number is required' }),
  campus: registrationCampusSchema,
  preferredAppointmentAt: z
    .string()
    .trim()
    .nonempty({ error: 'Preferred appointment is required' })
    .refine(isValidRegistrationAppointment, {
      error: 'Select a valid appointment date and time.',
    }),
  honeypot: z.string().optional(),
  formStartedAt: z.number().finite().optional(),
});

export type CreateRegistration = z.infer<typeof createRegistrationSchema>;

export const adminCredentialsSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters' }),
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

export const adminUserListItemSchema = z.object({
  id: z.number().positive(),
  email: z.email(),
  created_at: z.string(),
  is_super_admin: z.boolean(),
});

export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;

export const adminUsersResponseSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    currentAdminId: z.number().positive(),
    currentAdminEmail: z.email(),
    currentAdminIsSuperAdmin: z.boolean(),
    admins: z.array(adminUserListItemSchema),
  }),
});

export const updateSuperAdminSchema = z.object({
  isSuperAdmin: z.boolean(),
});

export type UpdateSuperAdmin = z.infer<typeof updateSuperAdminSchema>;

export const adminActionResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
});

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
export const emailWorkerStatusResultSchema = resultSchema(
  emailWorkerStatusSchema.nullable()
);
