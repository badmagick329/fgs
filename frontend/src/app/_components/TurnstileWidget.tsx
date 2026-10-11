'use client';

import Script from 'next/script';
import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';

type Turnstile = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      size: 'flexible';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    }
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export type TurnstileHandle = {
  /** Fetches a fresh token; call after a token was sent, since each works once. */
  reset(): void;
};

/**
 * Cloudflare Turnstile, rendered explicitly so the widget follows React's
 * mounts rather than scanning the page once on load. Reports the current
 * token, or null when there is none (not done yet, expired or failed).
 */
export default function TurnstileWidget({
  siteKey,
  action,
  onToken,
  ref,
}: {
  siteKey: string;
  action: string;
  onToken: (token: string | null) => void;
  ref?: Ref<TurnstileHandle>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    const turnstile = window.turnstile;
    if (!ready || !turnstile || !containerRef.current) return;
    const widgetId = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      // Fills the form's width; the fixed size overflows narrow phones.
      size: 'flexible',
      callback: (token) => onTokenRef.current(token),
      'expired-callback': () => onTokenRef.current(null),
      'error-callback': () => onTokenRef.current(null),
    });
    widgetIdRef.current = widgetId;
    return () => {
      turnstile.remove(widgetId);
      widgetIdRef.current = null;
    };
  }, [ready, siteKey, action]);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        onTokenRef.current(null);
        if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
      },
    }),
    []
  );

  return (
    <>
      {/* onReady also fires when the script is already loaded, e.g. after
          navigating back to the page. */}
      <Script
        src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        onReady={() => setReady(true)}
      />
      <div ref={containerRef} />
    </>
  );
}
