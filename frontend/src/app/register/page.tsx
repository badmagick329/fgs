import { JsonLd } from '@/app/_site-v2/_components/JsonLd';
import { createSiteMetadata } from '@/app/_site-v2/metadata';
import RegisterPage from '@/app/_site-v2/pages/RegisterPage';
import { breadcrumbStructuredData } from '@/app/_site-v2/structured-data';

export const metadata = createSiteMetadata({
  title: 'Admissions: Register at Farooqi Grammar School',
  description:
    'Start admission at Farooqi Grammar School, Lahore: see the admission process and office hours, then submit a registration request online.',
  pathname: '/register',
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbStructuredData('Admissions', '/register')} />
      <RegisterPage />
    </>
  );
}
