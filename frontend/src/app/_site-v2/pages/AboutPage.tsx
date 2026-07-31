import { ceoMessageContent } from '@/app/_marketing/content';
import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import { SectionPageLayout } from '@/app/_site-v2/_components/SectionPageLayout';
import { Check } from 'lucide-react';
import Image from 'next/image';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { aboutContent } from '../content';

function AboutFoundersSection() {
  return (
    <section id='founders' className='fgs-section scroll-mt-24'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='border-t border-border pt-12'>
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
        <div className='border-t border-border pt-12'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            A Message from the CEO of FGS
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
              <p
                key={paragraph}
                className={`fgs-copy ${index === 0 ? '' : 'mt-4'}`}
              >
                {paragraph}
              </p>
            ))}
            <div className='clear-both' />
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutFactsSection() {
  return (
    <section id='who-we-are' className='fgs-section scroll-mt-24'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='grid gap-6 border-y border-border py-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-center'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {aboutContent.factsTitle}
          </h2>
          <ul
            className='grid gap-3 sm:grid-cols-2'
            aria-label={aboutContent.factsTitle}
          >
            {aboutContent.facts.map((fact) => (
              <li
                key={fact}
                className='flex gap-2.5 text-sm leading-6 text-fgs-ink'
              >
                <Check
                  aria-hidden='true'
                  className='mt-1 h-4 w-4 shrink-0 text-brand-blue'
                  strokeWidth={2.5}
                />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <MarketingShell>
      <PageHero title={aboutContent.title} description={aboutContent.intro} />
      <SectionPageLayout
        sections={[
          { id: 'who-we-are', label: 'Who We Are' },
          { id: 'history', label: 'Our History' },
          { id: 'ceo-message', label: 'CEO Message' },
          { id: 'founders', label: 'Our Founders' },
          { id: 'technology', label: 'Technology' },
        ]}
      >
        <AboutFactsSection />
        <section id='history' className='fgs-section scroll-mt-24'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <OverviewSection
              title={aboutContent.historyTitle}
              paragraphs={aboutContent.historyParagraphs}
              className='mt-0'
            />
          </div>
        </section>
        <AboutCeoMessageSection />
        <AboutFoundersSection />
        <section id='technology' className='fgs-section scroll-mt-24 pb-16'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <OverviewSection
              title={aboutContent.technologyTitle}
              paragraphs={aboutContent.technologyParagraphs}
              className='mt-0 border-t border-border pt-12'
            />
          </div>
        </section>
      </SectionPageLayout>
    </MarketingShell>
  );
}
