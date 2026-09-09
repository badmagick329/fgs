import type { Metadata } from 'next';
import SiteV1HomePage from '@/app/_site-v1/HomePage';

export const metadata: Metadata = {
  title: 'Farooqi Grammar School Archive',
  description: 'Archived version of the Farooqi Grammar School website.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default SiteV1HomePage;
