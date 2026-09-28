'use client';

import { trackEvent } from '@/lib/analytics';
import { useEffect } from 'react';

/**
 * Phone and email links are rendered across several pages and site versions,
 * so one delegated listener tracks them all instead of wiring each anchor.
 * Phone anchors carry `data-campus` because campuses share numbers.
 */
export default function ContactLinkTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.('a');
      const href = link?.getAttribute('href');
      if (!link || !href) return;

      if (href.startsWith('tel:')) {
        trackEvent('Phone Click', {
          campus: link.dataset.campus ?? 'Unknown',
          number: href.slice('tel:'.length),
        });
      } else if (href.startsWith('mailto:')) {
        trackEvent('Email Click');
      }
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
