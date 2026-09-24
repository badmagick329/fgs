import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrations',
  robots: { index: false, follow: false },
};

export default function RegistrationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
