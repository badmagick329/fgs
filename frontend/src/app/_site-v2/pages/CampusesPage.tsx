import GalleryBlock from '@/app/_marketing/sections/GalleryBlock';
import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import { SectionPageLayout } from '@/app/_site-v2/_components/SectionPageLayout';
import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { campusesContent, contactDetails } from '../content';

function CampusGrid() {
  return (
    <div className='mt-8 space-y-6 px-4 sm:px-0'>
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
  return (
    <article
      id={campus.id}
      className='fgs-card scroll-mt-24 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)] lg:items-stretch'
    >
      <div>
        <h2 className='fgs-subheading'>
          <a
            href={`#${campus.id}`}
            className='rounded-sm transition-colors hover:text-fgs-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fgs-blue'
          >
            {campus.name}
          </a>
        </h2>
        <div className='mt-4 space-y-4'>
          <div>
            <p className='text-fgs-ink text-sm font-semibold'>Principal</p>
            <p className='fgs-copy mt-1.5'>{campus.principal}</p>
          </div>
          <div>
            <p className='text-fgs-ink text-sm font-semibold'>Phone</p>
            <div className='mt-1.5 space-y-1'>
              {campus.phones.map((phone) => (
                <a
                  key={phone.href}
                  className='fgs-copy fgs-accent-link block'
                  href={phone.href}
                >
                  {phone.display}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className='text-fgs-ink text-sm font-semibold'>Address</p>
            <p className='fgs-copy mt-1.5'>{campus.address}</p>
          </div>
        </div>
      </div>
      <div className='relative min-h-56 overflow-hidden rounded-lg border border-border bg-fgs-surface'>
        <iframe
          title={`${campus.name} location`}
          src={campus.embedMapUrl}
          loading='lazy'
          referrerPolicy='no-referrer-when-downgrade'
          className='absolute inset-0 h-full w-full border-0'
        />
      </div>
    </article>
  );
}

export default function CampusesPage() {
  return (
    <MarketingShell>
      <PageHero
        title={campusesContent.hero.title}
        description={campusesContent.hero.paragraphs}
        primaryCta={{
          href: '/preview/register',
          label: 'Register With FGS',
        }}
      />
      <SectionPageLayout
        sections={[
          { id: 'overview', label: 'Overview' },
          { id: 'gallery', label: 'Gallery' },
          { id: 'campuses', label: 'Our Campuses' },
          { id: 'learning', label: 'Classroom Learning' },
          { id: 'activities', label: 'Student Life' },
          { id: 'closing', label: 'One FGS Experience' },
        ]}
      >
        <section className='fgs-section pb-16'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24'>
            <div id='overview' className='scroll-mt-24'>
              <OverviewSection
                title={campusesContent.overview.title}
                paragraphs={[campusesContent.overview.paragraph]}
                links={contactDetails.campuses.map((campus) => ({
                  href: `#${campus.id}`,
                  description: campus.description,
                }))}
              />
            </div>
            <div id='gallery' className='scroll-mt-24 border-t border-border pt-12'>
              <GalleryBlock headingClassName='text-fgs-ink text-xl font-semibold sm:text-2xl' />
            </div>
            <div id='campuses' className='scroll-mt-24 border-t border-border pt-12'>
              <CampusGrid />
            </div>
            <div id='learning' className='scroll-mt-24'>
              <OverviewSection
                title={campusesContent.classroomLearning.title}
                paragraphs={campusesContent.classroomLearning.paragraphs}
              />
            </div>
            <div id='activities' className='scroll-mt-24'>
              <div className='border-t border-border pt-12'>
                <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
                  {campusesContent.activities.title}
                </h2>
                <p className='fgs-copy mt-4'>
                  {campusesContent.activities.paragraph}
                </p>
                <ul className='mt-6 ml-4 grid gap-x-8 gap-y-1 sm:ml-6 sm:grid-cols-2'>
                  {campusesContent.activities.items.map((item) => (
                    <li
                      key={item}
                      className='flex items-start gap-3 py-1 text-sm leading-relaxed text-muted-foreground'
                    >
                      <span
                        aria-hidden='true'
                        className='mt-1.5 size-2 shrink-0 rounded-full bg-primary'
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className='fgs-copy mt-6'>
                  {campusesContent.activities.note}
                </p>
              </div>
            </div>
            <div id='closing' className='scroll-mt-24'>
              <OverviewSection
                title={campusesContent.closing.title}
                paragraphs={[campusesContent.closing.paragraph]}
                className='mt-0 border-t border-border pt-12'
                links={[
                  {
                    href: '/preview/contact',
                    description: 'Contact Farooqi Grammar School',
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </SectionPageLayout>
    </MarketingShell>
  );
}
