import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

async function loadRoute() {
  return import('@/app/api/register/route');
}

function createAntiSpamServiceMock(overrides: Record<string, unknown> = {}) {
  return {
    checkRateLimit: mock(() => ({ ok: true })),
    checkHoneypot: mock(() => ({ ok: true })),
    checkMinimumSubmitTime: mock(() => ({ ok: true })),
    checkPayloadCooldown: mock(() => ({ ok: true })),
    markPayloadSubmitted: mock(() => {}),
    ...overrides,
  };
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
    const antiSpamService = createAntiSpamServiceMock();
    getServerContainer.mockReturnValue({
      registrationAntiSpamService: antiSpamService,
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
    const antiSpamService = createAntiSpamServiceMock();
    getServerContainer.mockReturnValue({
      registrationAntiSpamService: antiSpamService,
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
        formStartedAt: Date.now() - 5000,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(notifyDiscord).toHaveBeenCalled();
  });

  it('POST returns 429 when rate limited', async () => {
    const { POST } = await loadRoute();
    const antiSpamService = createAntiSpamServiceMock({
      checkRateLimit: mock(() => ({
        ok: false,
        status: 429,
        message: 'Unable to process request right now. Please try again later.',
      })),
    });

    getServerContainer.mockReturnValue({
      registrationAntiSpamService: antiSpamService,
      registrationService: {
        createRegistration: mock(async () => ({ ok: true })),
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'A',
        lastName: 'B',
        email: 'a@example.com',
        formStartedAt: Date.now() - 5000,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('POST returns 400 when honeypot is filled', async () => {
    const { POST } = await loadRoute();
    const antiSpamService = createAntiSpamServiceMock({
      checkHoneypot: mock(() => ({
        ok: false,
        status: 400,
        message: 'Unable to process request right now. Please try again later.',
      })),
    });

    getServerContainer.mockReturnValue({
      registrationAntiSpamService: antiSpamService,
      registrationService: {
        createRegistration: mock(async () => ({ ok: true })),
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'A',
        lastName: 'B',
        email: 'a@example.com',
        honeypot: 'bot-value',
        formStartedAt: Date.now() - 5000,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns 400 when submit is too fast', async () => {
    const { POST } = await loadRoute();
    const antiSpamService = createAntiSpamServiceMock({
      checkMinimumSubmitTime: mock(() => ({
        ok: false,
        status: 400,
        message: 'Unable to process request right now. Please try again later.',
      })),
    });

    getServerContainer.mockReturnValue({
      registrationAntiSpamService: antiSpamService,
      registrationService: {
        createRegistration: mock(async () => ({ ok: true })),
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'A',
        lastName: 'B',
        email: 'a@example.com',
        formStartedAt: Date.now(),
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns 409 when payload is in cooldown', async () => {
    const { POST } = await loadRoute();
    const antiSpamService = createAntiSpamServiceMock({
      checkPayloadCooldown: mock(() => ({
        ok: false,
        status: 409,
        message: 'Unable to process request right now. Please try again later.',
      })),
    });

    getServerContainer.mockReturnValue({
      registrationAntiSpamService: antiSpamService,
      registrationService: {
        createRegistration: mock(async () => ({ ok: true })),
      },
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'A',
        lastName: 'B',
        email: 'a@example.com',
        formStartedAt: Date.now() - 5000,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
