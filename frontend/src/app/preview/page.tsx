import HomePage from '@/app/_site-v2/pages/HomePage';
import { createPreviewMetadata } from '@/app/_site-v2/metadata';

export const metadata = createPreviewMetadata({
  title: 'Farooqi Grammar School Preview',
  description:
    'Preview the new multi-page marketing site for Farooqi Grammar School.',
  pathname: '/preview',
});

export default HomePage;
