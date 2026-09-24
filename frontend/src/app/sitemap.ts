import { SITE_URL } from '@/app/_site-v2/metadata';
import type { MetadataRoute } from 'next';

export const PUBLIC_PATHS = [
  '/',
  '/about',
  '/campuses',
  '/why-fgs',
  '/register',
  '/contact',
];

// No lastmod: a build-time timestamp changes every deploy and teaches Google to ignore it.
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((pathname) => ({ url: `${SITE_URL}${pathname}` }));
}
