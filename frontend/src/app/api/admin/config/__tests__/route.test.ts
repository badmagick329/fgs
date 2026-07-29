import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

import { GET, PATCH, POST } from '@/app/api/admin/config/route';

describe('/api/admin/config', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('GET returns config and applies refreshed cookies', async () => {
    const applyRefreshedAuthCookies = mock(() => {});
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: { payload: { sub: '1', email: 'a@a.com' }, refreshedTokens: null },
        })),
        applyRefreshedAuthCookies,
      },
      adminManagementService: {
        getAdminConfig: mock(async () => ({ id: 1, notification_email: 'n@n.com' })),
      },
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(applyRefreshedAuthCookies).toHaveBeenCalled();
  });

  it('POST validates notificationEmail', async () => {
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: { payload: { sub: '1', email: 'a@a.com' }, refreshedTokens: null },
        })),
      },
      adminManagementService: {},
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ notificationEmail: 'not-email' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('PATCH updates the Discord registration notification setting', async () => {
    const applyRefreshedAuthCookies = mock(() => {});
    const setRegistrationDiscordNotificationsEnabled = mock(async () => ({
      id: 1,
      notification_email: 'n@n.com',
      registration_discord_notifications_enabled: true,
    }));
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: { payload: { sub: '1', email: 'a@a.com' }, refreshedTokens: null },
        })),
        applyRefreshedAuthCookies,
      },
      adminManagementService: {
        setRegistrationDiscordNotificationsEnabled,
        getAdminConfig: mock(async () => ({
          id: 1,
          notification_email: 'n@n.com',
          registration_discord_notifications_enabled: true,
        })),
      },
    });

    const res = await PATCH(
      new Request('http://localhost', {
        method: 'PATCH',
        body: JSON.stringify({ registrationDiscordNotificationsEnabled: true }),
      })
    );

    expect(res.status).toBe(200);
    expect(setRegistrationDiscordNotificationsEnabled).toHaveBeenCalledWith(true, 1);
    expect(applyRefreshedAuthCookies).toHaveBeenCalled();
  });
});
