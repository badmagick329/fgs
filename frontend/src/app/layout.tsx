import type { Metadata } from 'next';
import { contactContent } from '@/app/_marketing/content';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Providers from './Providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteName = 'Farooqi Grammar School (FGS)';
const siteUrl = 'https://farooqigrammar.school';
const ogImage = '/fgs-logo.jpg';
const logoImage = '/fgs-logo.png';
const plausibleDomain = 'farooqigrammar.school';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      description:
        'Farooqi Grammar School (FGS) is a school in Lahore focused on academic excellence, character, and student growth.',
      inLanguage: 'en',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
    {
      '@type': ['EducationalOrganization', 'School'],
      '@id': `${siteUrl}/#organization`,
      name: siteName,
      alternateName: 'FGS',
      url: siteUrl,
      logo: `${siteUrl}${logoImage}`,
      image: `${siteUrl}${ogImage}`,
      email: contactContent.shared.email,
      description:
        'Farooqi Grammar School (FGS) is a school in Lahore focused on academic excellence, character, and student growth.',
      address: contactContent.campuses.map((campus) => ({
        '@type': 'PostalAddress',
        streetAddress: campus.address,
        addressLocality: 'Lahore',
        addressCountry: 'PK',
      })),
      contactPoint: contactContent.campuses.flatMap((campus) =>
        campus.phones.map((phone) => ({
          '@type': 'ContactPoint',
          contactType: `Admissions - ${campus.name}`,
          telephone: phone.href.replace('tel:', ''),
          areaServed: 'PK',
          availableLanguage: ['en', 'ur'],
        }))
      ),
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteName,
    template: '%s | FGS',
  },

  description:
    'Farooqi Grammar School (FGS) is a school in Lahore focused on academic excellence, character, and student growth. Explore admissions, campuses, and school life.',

  applicationName: siteName,
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

  alternates: {
    canonical: '/',
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
    type: 'website',
    url: siteUrl,
    title: siteName,
    description:
      'Learn about Farooqi Grammar School (FGS): admissions, campuses, achievements, and life at school.',
    siteName: siteName,
    locale: 'en_GB',
    images: [
      {
        url: ogImage,
        width: 592,
        height: 581,
        alt: `${siteName} | Official Website`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: siteName,
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
        <Script
          defer
          src='/ingest/js/script.js'
          data-domain={plausibleDomain}
          data-api='/ingest/api/event'
        />
        <Script
          id='structured-data'
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
