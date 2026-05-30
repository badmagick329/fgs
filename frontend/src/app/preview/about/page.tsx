import AboutPage from '@/app/_site-v2/pages/AboutPage';
import { createPreviewMetadata } from '@/app/_site-v2/metadata';

export const metadata = createPreviewMetadata({
  title: 'About Farooqi Grammar School',
  description:
    'Preview the new About page for Farooqi Grammar School, including school history, leadership, and educational values.',
  pathname: '/preview/about',
});

export default AboutPage;
