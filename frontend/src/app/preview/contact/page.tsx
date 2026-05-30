import ContactPage from '@/app/_site-v2/pages/ContactPage';
import { createPreviewMetadata } from '@/app/_site-v2/metadata';

export const metadata = createPreviewMetadata({
  title: 'Contact Farooqi Grammar School',
  description:
    'Preview the new contact page for Farooqi Grammar School with campus phone numbers, addresses, and map links.',
  pathname: '/preview/contact',
});

export default ContactPage;
