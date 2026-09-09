import AboutPage from '@/app/_site-v2/pages/AboutPage';
import { createSiteMetadata } from '@/app/_site-v2/metadata';

export const metadata = createSiteMetadata({
  title: 'About Farooqi Grammar School',
  description:
    'Learn about Farooqi Grammar School, including its history, leadership, founding values, and approach to education.',
  pathname: '/about',
});

export default AboutPage;
