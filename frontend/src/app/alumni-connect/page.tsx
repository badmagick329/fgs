import AlumniConnectPage from '@/app/_site-v2/pages/AlumniConnectPage';
import { connection } from 'next/server';
import { EnvConfig } from '@/lib/server/env-config';

export default async function Page() {
  // Rendered per request so the Turnstile key comes from the running
  // container's env, not the build's.
  await connection();
  return (
    <AlumniConnectPage
      turnstileSiteKey={new EnvConfig().getTurnstileSiteKey()}
    />
  );
}
