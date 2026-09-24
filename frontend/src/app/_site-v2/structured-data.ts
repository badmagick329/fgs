import { contactContent } from '@/app/_marketing/content';
import { SITE_NAME, SITE_URL } from './metadata';

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const SOCIAL_PROFILES = [
  'https://www.facebook.com/Farooqi.Schools',
  'https://www.youtube.com/@fgslahore',
];

// Mirrors the admissions timings shown on /register and /contact; a test keeps them in sync.
export const ADMISSIONS_OFFICE_HOURS = [
  {
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
    opens: '08:00',
    closes: '14:00',
  },
  { dayOfWeek: ['Friday'], opens: '08:00', closes: '12:00' },
];

const description =
  'Farooqi Grammar School (FGS) is a school in Lahore, founded in 1978, focused on academic excellence, character, and student growth.';

/*
 * Each campus is its own School node because Google matches campuses to separate
 * Maps listings and parents search for campuses by area (e.g. "karim park", "ravi road").
 */
export const homeStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description,
      inLanguage: 'en',
      publisher: { '@id': ORGANIZATION_ID },
    },
    {
      '@type': ['EducationalOrganization', 'School'],
      '@id': ORGANIZATION_ID,
      name: 'Farooqi Grammar School',
      alternateName: ['FGS', 'Farooqi Schools'],
      url: SITE_URL,
      logo: `${SITE_URL}/fgs-logo.png`,
      image: `${SITE_URL}/fgs-logo.jpg`,
      email: contactContent.shared.email,
      description,
      foundingDate: '1978',
      founder: [
        { '@type': 'Person', name: 'Asim Farooqi' },
        { '@type': 'Person', name: 'Zahida Asim Farooqi' },
      ],
      sameAs: SOCIAL_PROFILES,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'admissions',
        email: contactContent.shared.email,
        areaServed: 'PK',
        availableLanguage: ['en', 'ur'],
        hoursAvailable: ADMISSIONS_OFFICE_HOURS.map((hours) => ({
          '@type': 'OpeningHoursSpecification',
          ...hours,
        })),
      },
      subOrganization: contactContent.campuses.map((campus) => ({
        '@id': `${SITE_URL}/campuses#${campus.id}`,
      })),
    },
    ...contactContent.campuses.map((campus) => ({
      '@type': 'School',
      '@id': `${SITE_URL}/campuses#${campus.id}`,
      name: campus.name,
      url: `${SITE_URL}/campuses`,
      telephone: campus.phones[0].href.replace('tel:', ''),
      address: {
        '@type': 'PostalAddress',
        streetAddress: campus.address,
        addressLocality: 'Lahore',
        addressRegion: 'Punjab',
        addressCountry: 'PK',
      },
      hasMap: campus.mapUrl,
      parentOrganization: { '@id': ORGANIZATION_ID },
    })),
  ],
};

export function breadcrumbStructuredData(name: string, pathname: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name,
        item: `${SITE_URL}${pathname}`,
      },
    ],
  };
}
