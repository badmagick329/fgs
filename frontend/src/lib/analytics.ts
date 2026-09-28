type PlausibleProps = Record<string, string>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: PlausibleProps }) => void;
  }
}

/**
 * Names must match the custom-event goals configured in the Plausible
 * dashboard; events without a matching goal are recorded but not reported.
 */
export type AnalyticsEvent =
  | 'Registration'
  | 'Phone Click'
  | 'Email Click'
  | '404';

export function trackEvent(event: AnalyticsEvent, props?: PlausibleProps) {
  window.plausible?.(event, props ? { props } : undefined);
}
