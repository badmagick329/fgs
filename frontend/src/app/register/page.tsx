import RegisterPage from '@/app/_site-v2/pages/RegisterPage';
import { createSiteMetadata } from '@/app/_site-v2/metadata';

export const metadata = createSiteMetadata({
  title: 'Register With FGS',
  description:
    'Learn about admissions at Farooqi Grammar School and submit a registration request.',
  pathname: '/register',
});

export default RegisterPage;
