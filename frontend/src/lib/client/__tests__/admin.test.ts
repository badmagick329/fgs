import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import {
  changeAdminPassword,
  createAdmin,
  getAdminConfig,
  getAdminUsers,
  removeAdmin,
  saveAdminConfig,
  setRegistrationDiscordNotifications,
  updateAdminSuperStatus,
} from '../admin';

describe('admin client', () => {
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('sends only credentials when creating an admin from form values', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ok: true })
    );
    const values = {
      email: 'admin@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    await createAdmin(values);

    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: values.email, password: values.password }),
    });
  });

  it('omits confirmation fields when changing a password', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ok: true })
    );
    const values = {
      currentPassword: 'password123',
      newPassword: 'password456',
      confirmPassword: 'password456',
    };

    await changeAdminPassword(values);

    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    });
  });

  it('preserves an unset notification config', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ok: true, data: null })
    );

    expect(await getAdminConfig()).toBeNull();
  });

  it('keeps the config query error message independent of the server body', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ message: 'Unauthorized.' }, { status: 401 })
    );

    await expect(getAdminConfig()).rejects.toThrow('Failed to load config.');
  });

  it('returns updated notification config for the query cache', async () => {
    const config = {
      id: 1,
      notification_email: 'notifications@example.com',
      registration_discord_notifications_enabled: false,
      updated_by_admin_user_id: 1,
      updated_at: '2026-09-12T09:00:00.000Z',
      updated_by_email: 'admin@example.com',
    };
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ok: true, data: config })
    );

    expect(
      await saveAdminConfig({ notificationEmail: config.notification_email })
    ).toEqual(config);
    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationEmail: config.notification_email }),
    });
  });

  it('preserves a rejected Discord setting update and its request payload', async () => {
    const message =
      'Save a notification email before enabling Discord notifications.';
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ok: false, message }, { status: 409 })
    );

    await expect(setRegistrationDiscordNotifications(true)).rejects.toThrow(
      message
    );
    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationDiscordNotificationsEnabled: true }),
    });
  });

  it('rejects malformed admin list data', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ok: true, data: { admins: [] } })
    );

    await expect(getAdminUsers()).rejects.toThrow(
      'Invalid response from server.'
    );
  });

  it('targets the selected admin and sends the requested role', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ ok: true })
    );

    await updateAdminSuperStatus({ adminId: 2, isSuperAdmin: false });

    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/users/2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuperAdmin: false }),
    });
  });

  it('rejects unsuccessful removal even when HTTP status is successful', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        ok: false,
        message: 'Cannot remove the last super admin.',
      })
    );

    await expect(removeAdmin(2)).rejects.toThrow(
      'Cannot remove the last super admin.'
    );
    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/users/2', {
      method: 'DELETE',
    });
  });
});
