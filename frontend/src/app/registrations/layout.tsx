import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrations',
};

export default function RegistrationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
