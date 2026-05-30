import CampusesPage from '@/app/_site-v2/pages/CampusesPage';
import { createPreviewMetadata } from '@/app/_site-v2/metadata';

export const metadata = createPreviewMetadata({
  title: 'FGS Campuses',
  description:
    'Preview the new Campuses page for Farooqi Grammar School with Lahore campus details, contact information, and locations.',
  pathname: '/preview/campuses',
});

export default CampusesPage;
