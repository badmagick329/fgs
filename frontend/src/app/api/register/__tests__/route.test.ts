import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

async function loadRoute() {
  return import('@/app/api/register/route');
}

describe('/api/register', () => {
  beforeEach(() => {
    mock.restore();
    getServerContainer.mockReset();
  });

  it('GET passes through unauthorized response', async () => {
    const { GET } = await loadRoute();
    getServerContainer.mockReturnValue({
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: false,
          response: new Response(null, { status: 401 }),
        })),
      },
      registrationService: {},
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('POST returns 400 on validation failure', async () => {
    const { POST } = await loadRoute();
    getServerContainer.mockReturnValue({
      registrationService: {
        createRegistration: mock(async () => ({ ok: true })),
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ firstName: '', lastName: '', email: 'bad' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns 500 and notifies on create failure', async () => {
    const { POST } = await loadRoute();
    const notifyDiscord = mock(async () => ({}));
    getServerContainer.mockReturnValue({
      registrationService: {
        createRegistration: mock(async () => ({
          ok: false,
          message: 'db down',
        })),
        notifyDiscord,
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'A',
        lastName: 'B',
        email: 'a@example.com',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(notifyDiscord).toHaveBeenCalled();
  });
});
