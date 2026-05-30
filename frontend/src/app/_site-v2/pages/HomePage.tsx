import MarketingHero from '@/app/_marketing/sections/MarketingHero';
import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import { homeContent, schoolStats } from '../content';

function StatsSection() {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {schoolStats.map((stat) => (
        <article key={stat.label} className='fgs-card text-center'>
          <p className='text-brand-blue text-3xl font-semibold'>{stat.value}</p>
          <p className='mt-2 text-base font-semibold text-fgs-ink'>
            {stat.label}
          </p>
          {stat.supporting ? (
            <p className='fgs-copy mt-1'>{stat.supporting}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <MarketingShell>
      <MarketingHero />

      <section className='fgs-section'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
          <StatsSection />
          <OverviewSection
            title={homeContent.overviewTitle}
            paragraphs={homeContent.overviewParagraphs}
            links={[
              { href: '/preview/about', description: 'Learn About FGS' },
              {
                href: '/preview/why-fgs',
                description: 'Why Families Choose FGS',
              },
            ]}
          />
          <OverviewSection
            title={homeContent.secondaryOverviewTitle}
            paragraphs={homeContent.seconddaryOverviewParagraphs}
            links={[
              {
                href: '/preview/campuses',
                description: 'Explore Our Campuses',
              },
            ]}
          />
        </div>
      </section>
    </MarketingShell>
  );
}
