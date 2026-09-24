import { JsonLd } from '@/app/_site-v2/_components/JsonLd';
import { createSiteMetadata } from '@/app/_site-v2/metadata';
import ContactPage from '@/app/_site-v2/pages/ContactPage';
import { breadcrumbStructuredData } from '@/app/_site-v2/structured-data';

export const metadata = createSiteMetadata({
  title: 'Contact Us: Campus Phones, Addresses and Hours',
  description:
    'Phone numbers, addresses, maps, and admissions office hours for every Farooqi Grammar School campus in Lahore.',
  pathname: '/contact',
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbStructuredData('Contact', '/contact')} />
      <ContactPage />
    </>
  );
}
