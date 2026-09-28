import TrackNotFound from '@/app/_components/TrackNotFound';
import MarketingShell from '@/app/_site-v2/MarketingShell';
import PageHero from '@/app/_site-v2/PageHero';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <MarketingShell>
      <TrackNotFound />
      <PageHero
        title='Page not found'
        description='The page you are looking for does not exist or has moved.'
        primaryCta={{ href: '/', label: 'Go to homepage' }}
        secondaryCta={{ href: '/contact', label: 'Contact us' }}
      />
    </MarketingShell>
  );
}
