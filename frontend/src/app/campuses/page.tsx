import CampusesPage from '@/app/_site-v2/pages/CampusesPage';
import { createSiteMetadata } from '@/app/_site-v2/metadata';

export const metadata = createSiteMetadata({
  title: 'FGS Campuses',
  description:
    'Explore Farooqi Grammar School campuses in Lahore, including locations, age groups, facilities, and contact details.',
  pathname: '/campuses',
});

export default CampusesPage;
