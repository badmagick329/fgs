import { JsonLd } from '@/app/_site-v2/_components/JsonLd';
import { createSiteMetadata } from '@/app/_site-v2/metadata';
import WhyFgsPage from '@/app/_site-v2/pages/WhyFgsPage';
import { breadcrumbStructuredData } from '@/app/_site-v2/structured-data';

export const metadata = createSiteMetadata({
  title: 'Why Choose Farooqi Grammar School',
  description:
    'Discover why families in Lahore choose FGS: strong academic results, affordable fees, discipline, character-building, and student support.',
  pathname: '/why-fgs',
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbStructuredData('Why FGS', '/why-fgs')} />
      <WhyFgsPage />
    </>
  );
}
