import type { Metadata } from 'next';

const siteName = 'Farooqi Grammar School (FGS)';

export function createSiteMetadata({
  title,
  description,
  pathname,
}: {
  title: string;
  description: string;
  pathname: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: `${title} | FGS`,
      description,
      url: pathname,
      siteName,
    },
    twitter: {
      title: `${title} | FGS`,
      description,
    },
  };
}
