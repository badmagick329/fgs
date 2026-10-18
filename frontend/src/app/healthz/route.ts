import { getServerContainer } from '@/lib/server/container';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await getServerContainer().healthCheck.check();
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
