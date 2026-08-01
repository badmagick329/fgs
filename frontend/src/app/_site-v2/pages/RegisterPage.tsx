import RegistrationForm from '@/app/_components/RegistrationForm';
import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { FaqSection } from '../_components/FaqSection';
import { SectionPageLayout } from '../_components/SectionPageLayout';
import { registerContent } from '../content';

function RegisterProcessSection() {
  return (
    <section id='process' className='fgs-section scroll-mt-24'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='mt-8'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {registerContent.processTitle}
          </h2>

          <div className='relative mt-6'>
            <div
              aria-hidden='true'
              className='absolute inset-y-0 left-0 flex w-3.5 justify-center'
            >
              <div className='w-0.5 bg-brand-blue/30' />
            </div>
            <ol className='space-y-8'>
              {registerContent.steps.map((step) => (
                <li key={step.title} className='relative flex gap-4'>
                  <span
                    aria-hidden='true'
                    className='bg-brand-blue z-10 mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-fgs-surface'
                  />
                  <div className='space-y-3'>
                    <h3 className='text-fgs-ink text-lg font-medium sm:text-xl'>
                      {step.title}
                    </h3>
                    <p className='fgs-copy'>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <p className='fgs-copy mt-8 border-t border-border pt-6'>
            {registerContent.processNote}
          </p>
        </div>
      </div>
    </section>
  );
}

function AdmissionsTimingsSection() {
  return (
    <section id='timings' className='fgs-section scroll-mt-24 pt-10'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='border-y border-border py-6 sm:py-8'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {registerContent.timingsTitle}
          </h2>
          <dl className='mt-5 space-y-4'>
            {registerContent.timings.map((timing) => (
              <div
                key={timing.label}
                className='flex flex-col gap-1 text-base sm:flex-row sm:gap-2'
              >
                <dt className='text-fgs-ink font-semibold'>{timing.label}</dt>
                <dd className='fgs-copy'>{timing.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function AdmissionsSupportSection() {
  return (
    <section id='support' className='fgs-section scroll-mt-24'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='mt-8 border-l-4 border-brand-blue bg-brand-blue/5 px-6 py-6 sm:px-8 sm:py-7'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {registerContent.supportTitle}
          </h2>
          <p className='fgs-copy mt-5'>{registerContent.supportParagraph}</p>
          <Link className='fgs-btn-secondary mt-5' href={registerContent.supportLink.href}>
            {registerContent.supportLink.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

function RegistrationFormSection() {
  return (
    <section id='registration-form' className='fgs-section scroll-mt-24'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='mt-8 rounded-[0.3rem] border border-border bg-card px-5 py-5 shadow-sm sm:px-6 sm:py-6'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            Registration Form
          </h2>
          <div className='mt-5'>
            <RegistrationForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function RegisterFaqSection() {
  return (
    <section id='questions' className='fgs-section scroll-mt-24 pb-16'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <FaqSection
          title={registerContent.faqTitle}
          faqs={registerContent.faqs}
        />
      </div>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <MarketingShell>
      <PageHero
        title={registerContent.title}
        description={registerContent.description}
      />
      <SectionPageLayout
        sections={[
          { id: 'process', label: 'Admission Process' },
          { id: 'timings', label: 'Admissions Timings' },
          { id: 'support', label: 'Need Help?' },
          { id: 'registration-form', label: 'Registration Form' },
          { id: 'questions', label: 'FAQs' },
        ]}
      >
        <RegisterProcessSection />
        <AdmissionsTimingsSection />
        <AdmissionsSupportSection />
        <RegistrationFormSection />
        <RegisterFaqSection />
      </SectionPageLayout>
    </MarketingShell>
  );
}
