import { SITE_NAME, SITE_URL, TITLE_SUFFIX } from '@/app/_site-v2/metadata';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import ContactLinkTracker from './_components/ContactLinkTracker';
import Providers from './Providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const ogImage = '/fgs-logo.jpg';
const logoImage = '/fgs-logo.png';
const plausibleDomain = 'farooqigrammar.school';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_NAME,
    template: `%s${TITLE_SUFFIX}`,
  },

  description:
    'Farooqi Grammar School (FGS) is a school in Lahore focused on academic excellence, character, and student growth. Explore admissions, campuses, and school life.',

  applicationName: SITE_NAME,
  authors: [{ name: 'Farooqi Grammar School' }],
  creator: 'Farooqi Grammar School',
  publisher: 'Farooqi Grammar School',

  keywords: [
    'Farooqi Grammar School',
    'FGS',
    'Farooqi Schools',
    'school in Lahore',
    'Lahore school',
    'grammar school',
    'admissions',
    'campus',
    'student life',
    'co-curricular',
    'STEAM program',
  ],

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
    type: 'website',
    url: SITE_URL,
    title: SITE_NAME,
    description:
      'Learn about Farooqi Grammar School (FGS): admissions, campuses, achievements, and life at school.',
    siteName: SITE_NAME,
    locale: 'en_GB',
    images: [
      {
        url: ogImage,
        width: 592,
        height: 581,
        alt: `${SITE_NAME} | Official Website`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description:
      'Farooqi Grammar School (FGS) | admissions, campuses, achievements, and school life.',
    images: [ogImage],
  },

  icons: {
    icon: [{ url: '/favicon.ico' }, { url: logoImage, type: 'image/png' }],
    apple: [{ url: logoImage, type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        {/* Queues events fired before the deferred Plausible script loads. */}
        <Script id='plausible-init' strategy='beforeInteractive'>
          {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
        </Script>
        <Script
          defer
          src='/ingest/js/script.js'
          data-domain={plausibleDomain}
          data-api='/ingest/api/event'
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ContactLinkTracker />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
