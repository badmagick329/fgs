import { JsonLd } from '@/app/_site-v2/_components/JsonLd';
import { createSiteMetadata } from '@/app/_site-v2/metadata';
import HomePage from '@/app/_site-v2/pages/HomePage';
import { homeStructuredData } from '@/app/_site-v2/structured-data';

export const metadata = createSiteMetadata({
  title: { absolute: 'Farooqi Grammar School (FGS), Lahore | Since 1978' },
  description:
    'Farooqi Grammar School (FGS) in Lahore: affordable education from early years to Matric since 1978. Campuses on Ravi Road and Edward Road. Admissions info.',
  pathname: '/',
});

export default function Page() {
  return (
    <>
      <JsonLd data={homeStructuredData} />
      <HomePage />
    </>
  );
}
