import AcknowledgementSection from '@/app/_marketing/sections/AcknowledgementSection';
import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import { SectionPageLayout } from '@/app/_site-v2/_components/SectionPageLayout';
import { Check } from 'lucide-react';
import Image from 'next/image';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { aboutContent } from '../content';

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
          { id: 'founding-values', label: 'Founding Values' },
          { id: 'technology', label: 'Technology' },
          { id: 'acknowledgement', label: 'Acknowledgement' },
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
        <section id='founding-values' className='fgs-section scroll-mt-24'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <div className='mt-0 border-t border-border pt-12'>
              <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
                {aboutContent.foundingValuesTitle}
              </h2>
              <div className='mt-6 grid gap-4 sm:grid-cols-2'>
                <div className='p-3'>
                  <div className='mx-auto max-w-[12rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
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
                  <div className='mx-auto max-w-[12rem] overflow-hidden rounded-sm border border-border bg-card shadow-sm'>
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
              <div className='mt-4 space-y-4'>
                {aboutContent.foundingValuesParagraphs.map((paragraph) => (
                  <p key={paragraph} className='fgs-copy'>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section id='technology' className='fgs-section scroll-mt-24'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <OverviewSection
              title={aboutContent.technologyTitle}
              paragraphs={aboutContent.technologyParagraphs}
              className='mt-0 border-t border-border pt-12'
            />
          </div>
        </section>
        <div id='acknowledgement' className='scroll-mt-24'>
          <AcknowledgementSection />
        </div>
      </SectionPageLayout>
    </MarketingShell>
  );
}
