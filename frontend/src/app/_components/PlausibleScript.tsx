'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

const plausibleDomain = 'farooqigrammar.school';

/**
 * The analytics script is third-party code fetched through a rewrite, so it
 * stays off pages that handle admin credentials or registration PII. No
 * public page links into these routes, so a client-side navigation cannot
 * carry an already-loaded script across.
 */
const PRIVATE_PATH_PREFIXES = ['/admin', '/registrations'];

export function isAnalyticsPath(pathname: string) {
  return !PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function PlausibleScript() {
  const pathname = usePathname();
  if (!isAnalyticsPath(pathname)) return null;

  return (
    <Script
      src='/ingest/js/script.js'
      strategy='afterInteractive'
      data-domain={plausibleDomain}
      data-api='/ingest/api/event'
    />
  );
}
