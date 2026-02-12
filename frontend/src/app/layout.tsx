import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteName,
    template: `%s | ${siteName}`,
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
    icon: [{ url: '/favicon.ico' }, { url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-700 text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
