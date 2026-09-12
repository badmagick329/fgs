import {
  type AdminCredentials,
  type AdminPasswordChange,
  adminActionResponseSchema,
  adminUsersResponseSchema,
} from '@/types';
import { z } from 'zod';
import { API } from '@/lib/consts';
import { requestJson } from './request-json';

const adminConfigSchema = z
  .object({
    id: z.number(),
    notification_email: z.email(),
    registration_discord_notifications_enabled: z.boolean(),
    updated_by_admin_user_id: z.number(),
    updated_at: z.string(),
    updated_by_email: z.string(),
  })
  .nullable();

const adminConfigResponseSchema = z.object({ data: adminConfigSchema });
const adminMutationResponseSchema = z.object({
  message: z.string().optional(),
});

export type AdminConfig = z.infer<typeof adminConfigSchema>;
export type AdminUsersData = z.infer<typeof adminUsersResponseSchema>['data'];

export async function getAdminUsers() {
  const result = await requestJson(API.admin.users, {
    schema: adminUsersResponseSchema,
    errorMessage: 'Failed to load admin users.',
  });
  return result.data;
}

export function createAdmin({ email, password }: AdminCredentials) {
  return requestJson(API.admin.users, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    schema: adminMutationResponseSchema,
    errorMessage: 'Failed to create admin.',
  });
}

export function changeAdminPassword({
  currentPassword,
  newPassword,
}: AdminPasswordChange) {
  return requestJson(API.admin.password, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
    schema: adminMutationResponseSchema,
    errorMessage: 'Password update failed.',
  });
}

export async function getAdminConfig() {
  const result = await requestJson(API.admin.config, {
    schema: adminConfigResponseSchema,
    errorMessage: () => 'Failed to load config.',
  });
  return result.data;
}

export async function saveAdminConfig(input: { notificationEmail: string }) {
  const result = await requestJson(API.admin.config, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationEmail: input.notificationEmail }),
    schema: adminConfigResponseSchema,
    errorMessage: 'Update failed.',
  });
  return result.data;
}

export async function setRegistrationDiscordNotifications(enabled: boolean) {
  const result = await requestJson(API.admin.config, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationDiscordNotificationsEnabled: enabled }),
    schema: adminConfigResponseSchema,
    errorMessage: 'Update failed.',
  });
  return result.data;
}

export function updateAdminSuperStatus({
  adminId,
  isSuperAdmin,
}: {
  adminId: number;
  isSuperAdmin: boolean;
}) {
  return requestJson(API.admin.userById(adminId), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isSuperAdmin }),
    schema: z.unknown(),
    errorMessage: 'Failed to update super admin status.',
  });
}

export async function removeAdmin(adminId: number) {
  const json = await requestJson(API.admin.userById(adminId), {
    method: 'DELETE',
    schema: z.unknown(),
    errorMessage: 'Failed to remove admin.',
  });
  const parsed = adminActionResponseSchema.safeParse(json);
  if (!parsed.success || !parsed.data.ok) {
    const error = adminMutationResponseSchema.safeParse(json);
    throw new Error(
      (error.success ? error.data.message : undefined) ??
        'Failed to remove admin.'
    );
  }
  return parsed.data;
}
