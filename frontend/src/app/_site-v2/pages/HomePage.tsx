import { ceoMessageContent } from '@/app/_marketing/content';
import MarketingHero from '@/app/_marketing/sections/MarketingHero';
import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import Image from 'next/image';
import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import { aboutContent, homeContent, homeStats } from '../content';

function StatsSection() {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {homeStats.map((stat) => (
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

function HomeCeoMessageSection() {
  return (
    <section className='mt-16 border-t border-border pt-12'>
      <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
        Message from our CEO
      </h2>
      <div className='mt-4'>
        <div className='mb-6 rounded-3xl p-3 sm:float-left sm:mb-4 sm:mr-6 sm:w-[18rem] sm:pl-0 sm:pr-0 sm:pt-0'>
          <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
            <Image
              src='/sameer.webp'
              alt='Sameer Asim Farooqi'
              width={640}
              height={640}
              className='aspect-square h-auto w-full object-cover'
            />
            <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
              <p className='text-fgs-ink text-center text-sm font-medium'>
                Sameer Asim Farooqi
              </p>
            </div>
          </div>
        </div>
        {ceoMessageContent.paragraphs.map((paragraph, index) => (
          <p key={paragraph} className={`fgs-copy ${index === 0 ? '' : 'mt-4'}`}>
            {paragraph}
          </p>
        ))}
        <div className='clear-both' />
      </div>
    </section>
  );
}

function HomeFoundersSection() {
  return (
    <section className='mt-16 border-t border-border pt-12'>
      <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
        {aboutContent.foundersTitle}
      </h2>
      <div className='mt-4 space-y-4'>
        {aboutContent.foundersParagraphs.map((paragraph) => (
          <p key={paragraph} className='fgs-copy'>
            {paragraph}
          </p>
        ))}
      </div>
      <div className='mt-6 grid gap-4 sm:grid-cols-2'>
        <div className='p-3'>
          <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
            <div>
              <Image
                src='/asim_2.webp'
                alt='Honorable Sir Asim Farooqi'
                width={640}
                height={640}
                className='aspect-square h-auto w-full object-cover'
              />
            </div>
            <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
              <p className='text-fgs-ink text-center text-sm font-medium'>
                Sir Asim Farooqi
              </p>
            </div>
          </div>
        </div>
        <div className='p-3'>
          <div className='mx-auto max-w-[16rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
            <div>
              <Image
                src='/zahida.webp'
                alt='Respected Madam Zahida Asim Farooqi'
                width={640}
                height={640}
                className='aspect-square h-auto w-full object-cover'
              />
            </div>
            <div className='border-t border-brand-blue/20 bg-brand-blue/5 px-4 py-3'>
              <p className='text-fgs-ink text-center text-sm font-medium'>
                Madam Zahida Asim Farooqi
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <MarketingShell>
      <MarketingHero overlayLines={homeContent.heroOverlayLines} />

      <section className='fgs-section pb-16'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
          <StatsSection />
          <OverviewSection
            title={homeContent.overviewTitle}
            paragraphs={homeContent.overviewParagraphs}
            className='mt-12'
            links={[
              { href: '/preview/about', description: 'Learn About FGS' },
              {
                href: '/preview/why-fgs',
                description: 'Why Families Choose FGS',
              },
            ]}
          />
          <HomeCeoMessageSection />
          <HomeFoundersSection />
          <OverviewSection
            title={homeContent.secondaryOverviewTitle}
            paragraphs={homeContent.seconddaryOverviewParagraphs}
            className='mt-16 border-t border-border pt-12'
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
