import type { Metadata } from 'next';

export const SITE_URL = 'https://farooqigrammar.school';
export const SITE_NAME = 'Farooqi Grammar School (FGS)';

/*
 * Title convention:
 * - Title Case, page subject first; ": " before a qualifier, " (Page N)" for pagination.
 * - The "| FGS" suffix comes only from the root layout template, so it appears exactly once.
 * - Homepage uses an absolute title leading with name + location, since brand and
 *   local searches ("farooqi grammar school lahore", "fgs school") drive most traffic.
 * - Keep titles under ~60 characters including the suffix.
 */
export const TITLE_SUFFIX = ' | FGS';

export function createSiteMetadata({
  title,
  description,
  pathname,
}: {
  title: string | { absolute: string };
  description: string;
  pathname: string;
}): Metadata {
  const fullTitle =
    typeof title === 'string' ? `${title}${TITLE_SUFFIX}` : title.absolute;

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: pathname,
      siteName: SITE_NAME,
    },
    twitter: {
      title: fullTitle,
      description,
    },
  };
}
