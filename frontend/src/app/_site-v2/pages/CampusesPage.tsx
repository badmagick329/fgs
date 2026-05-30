import GalleryBlock from '@/app/_marketing/sections/GalleryBlock';
import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { campusesContent, contactDetails } from '../content';

function CampusGrid() {
  return (
    <div className='mt-8 grid gap-4 sm:grid-cols-2 sm:px-0 px-4'>
      {contactDetails.campuses.map((campus) => (
        <CampusCard key={campus.name} campus={campus} />
      ))}
    </div>
  );
}

function CampusCard({
  campus,
}: {
  campus: (typeof contactDetails.campuses)[number];
}) {
  const campusCardContent =
    campusesContent.campusCards[
      campus.name as keyof typeof campusesContent.campusCards
    ];

  return (
    <article
      id={campus.id}
      className='fgs-card scroll-mt-24 flex h-full flex-col'
    >
      <div className='fgs-placeholder mb-4 aspect-4/3 rounded-sm'>
        {
          campusesContent.campusPlaceholders[
            campus.name as keyof typeof campusesContent.campusPlaceholders
          ]
        }
      </div>
      <h2 className='fgs-subheading'>{campus.name}</h2>
      <div className='mt-3 space-y-4'>
        {campusCardContent.paragraphs.map((paragraph) => (
          <p key={paragraph} className='fgs-copy'>
            {paragraph}
          </p>
        ))}
        <p className='fgs-copy font-medium text-fgs-ink'>
          {campusCardContent.principal}
        </p>
      </div>
      <div className='mt-6'>
        <Link
          className='fgs-btn-secondary'
          href={`/preview/contact#${campus.id}`}
        >
          {`Contact ${campus.description}`}
        </Link>
      </div>
    </article>
  );
}

export default function CampusesPage() {
  return (
    <MarketingShell>
      <PageHero
        title={campusesContent.hero.title}
        description={campusesContent.hero.paragraph}
        primaryCta={{
          href: '/preview/register',
          label: 'Register With FGS',
        }}
      />

      <section className='fgs-section'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24'>
          <OverviewSection
            title={campusesContent.overview.title}
            paragraphs={[campusesContent.overview.paragraph]}
            links={contactDetails.campuses.map((campus) => ({
              href: `#${campus.id}`,
              description: campus.description,
            }))}
          />
          <div className='mt-8'>
            <GalleryBlock />
          </div>
          <CampusGrid />
        </div>
      </section>
    </MarketingShell>
  );
}
