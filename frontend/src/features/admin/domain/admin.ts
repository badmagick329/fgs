import * as z from 'zod';

export const adminCredentialsSchema = z.object({
  email: z.email({ error: 'Invalid email address' }),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters' }),
});

export type AdminCredentials = z.infer<typeof adminCredentialsSchema>;

export const adminSetupSchema = adminCredentialsSchema.extend({
  setupToken: z.string().min(1, { error: 'Setup token is required' }),
});

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
