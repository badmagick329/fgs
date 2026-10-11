import { createSiteMetadata } from '@/app/_site-v2/metadata';
import type { Metadata } from 'next';

// Kept out of search until Alumni Connect is complete; alumni reach it
// through the pamphlet link. FGS-17 opens it up.
export const metadata: Metadata = {
  ...createSiteMetadata({
    title: 'Alumni Connect: Share Your Story',
    description:
      'FGS alumni: share your journey and advice with current Farooqi Grammar School students as a video, photos or a written message.',
    pathname: '/alumni-connect',
  }),
  robots: { index: false, follow: false },
};

export default function AlumniConnectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
