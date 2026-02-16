import { afterAll } from 'bun:test';

type ResendResponseMode = 'success' | 'provider_error';

type CapturedRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
};

type ResendMockState = {
  readonly baseUrl: string;
  setMode: (mode: ResendResponseMode) => void;
  reset: () => void;
  getRequests: () => CapturedRequest[];
};

const previousEnv = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SENDER_EMAIL_ADDRESS: process.env.SENDER_EMAIL_ADDRESS,
  RESEND_BASE_URL: process.env.RESEND_BASE_URL,
};

let responseMode: ResendResponseMode = 'success';
const capturedRequests: CapturedRequest[] = [];

const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  async fetch(request: Request): Promise<Response> {
    const bodyText = await request.text();
    let parsedBody: unknown = null;
    const requestHeaders: Record<string, string> = {};

    if (bodyText.length > 0) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }

    request.headers.forEach((value, key) => {
      requestHeaders[key] = value;
    });

    capturedRequests.push({
      method: request.method,
      path: new URL(request.url).pathname,
      headers: requestHeaders,
      body: parsedBody,
    });

    if (responseMode === 'provider_error') {
      return Response.json(
        {
          name: 'validation_error',
          message: 'mock provider rejection',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    return Response.json({ id: 'email_mock_123' });
  },
});

process.env.RESEND_API_KEY = 're_test_key';
process.env.SENDER_EMAIL_ADDRESS = 'verified@example.com';
process.env.RESEND_BASE_URL = `http://127.0.0.1:${server.port}`;

const resendMockState: ResendMockState = {
  baseUrl: process.env.RESEND_BASE_URL,
  setMode(mode: ResendResponseMode) {
    responseMode = mode;
  },
  reset() {
    responseMode = 'success';
    capturedRequests.length = 0;
  },
  getRequests() {
    return [...capturedRequests];
  },
};

Object.assign(globalThis, {
  __resendMockState: resendMockState,
});

afterAll(() => {
  server.stop(true);

  process.env.RESEND_API_KEY = previousEnv.RESEND_API_KEY;
  process.env.SENDER_EMAIL_ADDRESS = previousEnv.SENDER_EMAIL_ADDRESS;
  process.env.RESEND_BASE_URL = previousEnv.RESEND_BASE_URL;
});
