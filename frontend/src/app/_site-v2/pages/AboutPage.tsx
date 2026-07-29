import { ceoMessageContent } from '@/app/_marketing/content';
import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import { SectionNavigator } from '@/app/_site-v2/_components/SectionNavigator';
import Image from 'next/image';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { aboutContent } from '../content';

function AboutFoundersSection() {
  return (
    <section id='founders' className='fgs-section scroll-mt-24'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='fgs-panel'>
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
        </div>
      </div>
    </section>
  );
}

function AboutCeoMessageSection() {
  return (
    <section id='ceo-message' className='fgs-section scroll-mt-24'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='fgs-panel'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {ceoMessageContent.title}
          </h2>
          <div className='mt-4 space-y-4'>
            {ceoMessageContent.paragraphs.map((paragraph) => (
              <p key={paragraph} className='fgs-copy'>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <MarketingShell>
      <PageHero title={aboutContent.title} description={aboutContent.intro} />
      <SectionNavigator
        sections={[
          { id: 'overview', label: 'Our Story' },
          { id: 'founders', label: 'Our Founders' },
          { id: 'ceo-message', label: 'CEO Message' },
          { id: 'future', label: 'Looking Ahead' },
        ]}
      />

      <section id='overview' className='fgs-section scroll-mt-24'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
          <OverviewSection
            title={aboutContent.overviewTitle}
            paragraphs={aboutContent.overviewParagraphs}
          />
        </div>
      </section>
      <AboutFoundersSection />
      <AboutCeoMessageSection />
      <section id='future' className='fgs-section scroll-mt-24 pb-16'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
          <OverviewSection
            title={aboutContent.futureTitle}
            paragraphs={aboutContent.futureParagraphs}
          />
        </div>
      </section>
    </MarketingShell>
  );
}
