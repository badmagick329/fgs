import { JsonLd } from '@/app/_site-v2/_components/JsonLd';
import { createSiteMetadata } from '@/app/_site-v2/metadata';
import AboutPage from '@/app/_site-v2/pages/AboutPage';
import { breadcrumbStructuredData } from '@/app/_site-v2/structured-data';

export const metadata = createSiteMetadata({
  title: 'About Farooqi Grammar School',
  description:
    'Learn about Farooqi Grammar School, including its history since 1978, founders, leadership, values, and approach to education in Lahore.',
  pathname: '/about',
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbStructuredData('About', '/about')} />
      <AboutPage />
    </>
  );
}
