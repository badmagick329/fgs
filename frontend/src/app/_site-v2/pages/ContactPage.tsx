import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { SectionPageLayout } from '../_components/SectionPageLayout';
import { contactDetails, contactPageContent } from '../content';

function CampusContactGrid() {
  return (
    <div className='mt-8 space-y-6'>
      {contactDetails.campuses.map((campus) => (
        <CampusContactCard key={campus.name} campus={campus} />
      ))}
    </div>
  );
}

function GeneralEmailSection() {
  return (
    <div className='mt-8 border-y border-border py-6 sm:py-8'>
      <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
        General Email Enquiries
      </h2>
      <p className='fgs-copy mt-4'>
        For general enquiries, contact Farooqi Grammar School by email.
      </p>
      <a
        className='fgs-accent-link mt-4 inline-block text-base font-semibold'
        href={`mailto:${contactDetails.shared.email}`}
      >
        {contactDetails.shared.email}
      </a>
    </div>
  );
}

function CampusContactCard({
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

export default function ContactPage() {
  return (
    <MarketingShell>
      <PageHero
        title={contactPageContent.title}
        description={contactPageContent.description}
      />
      <SectionPageLayout
        sections={[
          { id: 'email-enquiries', label: 'Email Enquiries' },
          { id: 'campuses', label: 'Our Campuses' },
          { id: 'timings', label: 'Admissions Times' },
        ]}
      >
        <section id='email-enquiries' className='fgs-section scroll-mt-24'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <GeneralEmailSection />
          </div>
        </section>

        <section id='campuses' className='fgs-section scroll-mt-24'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <CampusContactGrid />
          </div>
        </section>

        <section id='timings' className='fgs-section scroll-mt-24 pb-16'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <OverviewSection
              title={contactPageContent.timingsTitle}
              paragraphs={contactPageContent.timingsParagraphs}
            />
          </div>
        </section>
      </SectionPageLayout>
    </MarketingShell>
  );
}
