import { beforeEach, describe, expect, it, mock } from 'bun:test';

mock.module('server-only', () => ({}));
const getServerContainer = mock(() => ({}));
mock.module('@/lib/serveronly/container', () => ({ getServerContainer }));

async function loadRoute() {
  return import('@/app/api/register/route');
}

function createValidPayload() {
  return {
    studentName: 'Student Name',
    parentName: 'Parent Name',
    className: 'Class 5',
    mobileNumber: '03001234567',
    campus: 'Boys Campus',
    preferredAppointmentAt: '2026-04-01T08:00:00+05:00',
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
      body: JSON.stringify({ studentName: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
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
        campus: 'Boys Campus',
        preferred_appointment_at: new Date('2026-04-01T08:00:00+05:00'),
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
