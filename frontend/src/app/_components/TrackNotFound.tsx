'use client';

import { trackEvent } from '@/lib/analytics';
import { useEffect } from 'react';

export default function TrackNotFound() {
  useEffect(() => {
    trackEvent('404', { path: window.location.pathname });
  }, []);

  return null;
}
