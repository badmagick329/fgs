import {
  createFutureRegistrationAppointmentAt,
  createFutureRegistrationAppointmentDate,
} from '@/test/registration-test-utils';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/server/container', () => ({ getServerContainer }));

async function loadRoute() {
  return import('@/app/api/register/route');
}

function createValidPayload() {
  return {
    studentName: 'Student Name',
    parentName: 'Parent Name',
    className: 'Class 5',
    mobileNumber: '03001234567',
    campus: 'FGS Ravi Road Boys Campus',
    preferredAppointmentAt: createFutureRegistrationAppointmentAt(),
    formStartedAt: Date.now() - 5000,
  };
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

    const res = await GET(new Request('http://localhost/api/register'));
    expect(res.status).toBe(401);
  });

  function adminContainer(getRegistrations: ReturnType<typeof mock>) {
    return {
      adminAccessService: {
        requireAdminRouteAuth: mock(async () => ({
          ok: true,
          auth: { refreshedTokens: null },
        })),
        applyRefreshedAuthCookies: mock(() => {}),
      },
      registrationService: { getRegistrations },
    };
  }

  it('GET requests the page named in the query string, defaulting to 1', async () => {
    const { GET } = await loadRoute();
    const getRegistrations = mock(async (_page: number) => ({
      ok: true as const,
      data: { registrations: [], page: 1, pageSize: 50, hasNextPage: false },
    }));
    getServerContainer.mockReturnValue(adminContainer(getRegistrations));

    expect(
      (await GET(new Request('http://localhost/api/register?page=3'))).status
    ).toBe(200);
    expect(
      (await GET(new Request('http://localhost/api/register'))).status
    ).toBe(200);

    expect(getRegistrations.mock.calls).toEqual([[3], [1]]);
  });

  for (const page of ['0', '-1', '1.5', 'abc', '10001']) {
    it(`GET rejects page=${page} with 400 before querying`, async () => {
      const { GET } = await loadRoute();
      const getRegistrations = mock(async () => ({ ok: true as const }));
      getServerContainer.mockReturnValue(adminContainer(getRegistrations));

      const res = await GET(
        new Request(`http://localhost/api/register?page=${page}`)
      );

      expect(res.status).toBe(400);
      expect((await res.json()).ok).toBe(false);
      expect(getRegistrations).not.toHaveBeenCalled();
    });
  }

  for (const [field, length] of [
    ['studentName', 121],
    ['parentName', 121],
    ['className', 41],
  ] as const) {
    it(`POST rejects an oversize ${field} with 400 before creating a registration`, async () => {
      const { POST } = await loadRoute();
      const createRegistration = mock(async () => ({ ok: true as const }));
      getServerContainer.mockReturnValue({
        registrationAntiSpamService: createAntiSpamServiceMock(),
        registrationService: { createRegistration },
      });

      const res = await POST(
        new Request('http://localhost', {
          method: 'POST',
          body: JSON.stringify({
            ...createValidPayload(),
            [field]: 'x'.repeat(length),
          }),
        })
      );

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.ok).toBe(false);
      expect(json.errors).toContainEqual(
        expect.objectContaining({ field, code: 'too_big' })
      );
      expect(createRegistration).not.toHaveBeenCalled();
    });
  }

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
      body: JSON.stringify({ studentName: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST rejects a malformed mobile number before creating a registration', async () => {
    const { POST } = await loadRoute();
    const createRegistration = mock(async () => ({ ok: true as const }));
    getServerContainer.mockReturnValue({
      registrationAntiSpamService: createAntiSpamServiceMock(),
      registrationService: { createRegistration },
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          ...createValidPayload(),
          mobileNumber: '999',
        }),
      })
    );

    expect(res.status).toBe(400);
    expect(createRegistration).not.toHaveBeenCalled();
  });

  it('POST creates registration with new payload shape', async () => {
    const { POST } = await loadRoute();
    const antiSpamService = createAntiSpamServiceMock();
    const createRegistration = mock(async () => ({
      ok: true as const,
      data: {
        id: 1,
        student_name: 'Student Name',
        parent_name: 'Parent Name',
        class_name: 'Class 5',
        mobile_number: '03001234567',
        campus: 'FGS Ravi Road Boys Campus',
        preferred_appointment_at: createFutureRegistrationAppointmentDate(),
        registration_message: null,
        registered_at: new Date(),
        updated_at: null,
        email_status: 'pending',
        retry_count: 0,
      },
    }));
    getServerContainer.mockReturnValue({
      registrationAntiSpamService: antiSpamService,
      registrationService: {
        createRegistration,
      },
      adminManagementService: {
        areRegistrationDiscordNotificationsEnabled: mock(async () => false),
      },
    });

    const payload = createValidPayload();
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(createRegistration).toHaveBeenCalledWith({
      studentName: payload.studentName,
      parentName: payload.parentName,
      className: payload.className,
      mobileNumber: payload.mobileNumber,
      campus: payload.campus,
      preferredAppointmentAt: payload.preferredAppointmentAt,
    });
  });

  it('POST normalizes a legacy campus value before saving', async () => {
    const { POST } = await loadRoute();
    const antiSpamService = createAntiSpamServiceMock();
    const createRegistration = mock(async () => ({
      ok: true as const,
      data: {},
    }));
    getServerContainer.mockReturnValue({
      registrationAntiSpamService: antiSpamService,
      registrationService: { createRegistration },
      adminManagementService: {
        areRegistrationDiscordNotificationsEnabled: mock(async () => false),
      },
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          ...createValidPayload(),
          campus: 'Boys Campus',
        }),
      })
    );

    expect(res.status).toBe(201);
    expect(createRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ campus: 'FGS Ravi Road Boys Campus' })
    );
  });

  it('POST sends a PII-free Discord notification when testing is enabled', async () => {
    const { POST } = await loadRoute();
    const notifyDiscord = mock(
      async (_input: { source: string; message: string }) => ({})
    );
    getServerContainer.mockReturnValue({
      registrationAntiSpamService: createAntiSpamServiceMock(),
      registrationService: {
        createRegistration: mock(async () => ({
          ok: true as const,
          data: {
            id: 47,
            student_name: 'Student Name',
            parent_name: 'Parent Name',
            class_name: 'Class 5',
            mobile_number: '03001234567',
            campus: 'FGS Ravi Road Boys Campus',
            preferred_appointment_at: createFutureRegistrationAppointmentDate(),
            registration_message: null,
            registered_at: new Date(),
            updated_at: null,
            email_status: 'pending' as const,
            retry_count: 0,
          },
        })),
        notifyDiscord,
      },
      adminManagementService: {
        areRegistrationDiscordNotificationsEnabled: mock(async () => true),
      },
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(createValidPayload()),
      })
    );

    expect(res.status).toBe(201);
    expect(notifyDiscord).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'registration.created' })
    );
    const message = notifyDiscord.mock.calls[0]?.[0].message;
    expect(message).not.toContain('Student Name');
    expect(message).not.toContain('Parent Name');
    expect(message).not.toContain('03001234567');
  });

  it('POST still succeeds when checking the Discord setting fails', async () => {
    const { POST } = await loadRoute();
    getServerContainer.mockReturnValue({
      registrationAntiSpamService: createAntiSpamServiceMock(),
      registrationService: {
        createRegistration: mock(async () => ({
          ok: true as const,
          data: {
            id: 1,
            student_name: 'Student Name',
            parent_name: 'Parent Name',
            class_name: 'Class 5',
            mobile_number: '03001234567',
            campus: 'FGS Ravi Road Boys Campus',
            preferred_appointment_at: createFutureRegistrationAppointmentDate(),
            registration_message: null,
            registered_at: new Date(),
            updated_at: null,
            email_status: 'pending' as const,
            retry_count: 0,
          },
        })),
      },
      adminManagementService: {
        areRegistrationDiscordNotificationsEnabled: mock(async () => {
          throw new Error('database unavailable');
        }),
      },
    });

    const res = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify(createValidPayload()),
      })
    );

    expect(res.status).toBe(201);
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
      body: JSON.stringify(createValidPayload()),
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
      body: JSON.stringify(createValidPayload()),
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
        ...createValidPayload(),
        honeypot: 'bot-value',
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
        ...createValidPayload(),
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
      body: JSON.stringify(createValidPayload()),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});
