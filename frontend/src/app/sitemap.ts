import type { MetadataRoute } from 'next';

const siteUrl = 'https://farooqigrammar.school';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ['/', '/about', '/campuses', '/why-fgs', '/register', '/contact'].map(
    (pathname, index) => ({
      url: `${siteUrl}${pathname}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: index === 0 ? 1 : 0.8,
    })
  );
}
