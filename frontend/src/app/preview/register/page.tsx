import RegisterPage from '@/app/_site-v2/pages/RegisterPage';
import { createPreviewMetadata } from '@/app/_site-v2/metadata';

export const metadata = createPreviewMetadata({
  title: 'Register With FGS',
  description:
    'Preview the new registration page for Farooqi Grammar School with admissions guidance and the registration form.',
  pathname: '/preview/register',
});

export default RegisterPage;
