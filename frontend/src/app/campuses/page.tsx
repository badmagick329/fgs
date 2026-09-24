import { JsonLd } from '@/app/_site-v2/_components/JsonLd';
import { createSiteMetadata } from '@/app/_site-v2/metadata';
import CampusesPage from '@/app/_site-v2/pages/CampusesPage';
import { breadcrumbStructuredData } from '@/app/_site-v2/structured-data';

export const metadata = createSiteMetadata({
  title: 'Campuses in Lahore: Ravi Road and Edward Road',
  description:
    'Explore Farooqi Grammar School campuses on Ravi Road and Edward Road, Lahore, including age groups, facilities, addresses, and phone numbers.',
  pathname: '/campuses',
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbStructuredData('Campuses', '/campuses')} />
      <CampusesPage />
    </>
  );
}
