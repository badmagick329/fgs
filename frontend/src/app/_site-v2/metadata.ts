import type { Metadata } from 'next';

const siteName = 'Farooqi Grammar School (FGS)';

export function createPreviewMetadata({
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
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: `${title} | FGS Preview`,
      description,
      url: pathname,
      siteName,
    },
    twitter: {
      title: `${title} | FGS Preview`,
      description,
    },
  };
}
