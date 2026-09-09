import ContactPage from '@/app/_site-v2/pages/ContactPage';
import { createSiteMetadata } from '@/app/_site-v2/metadata';

export const metadata = createSiteMetadata({
  title: 'Contact Farooqi Grammar School',
  description:
    'Find contact details, addresses, phone numbers, and map links for Farooqi Grammar School campuses.',
  pathname: '/contact',
});

export default ContactPage;
