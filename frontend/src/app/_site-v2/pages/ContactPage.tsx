'use client';

import { OverviewSection } from '@/app/_site-v2/_components/OverviewSection';
import { acknowledgementContent } from '@/app/_marketing/content';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { contactDetails, contactPageContent } from '../content';

function CampusContactGrid({
  onViewMap,
}: {
  onViewMap: (campus: (typeof contactDetails.campuses)[number]) => void;
}) {
  return (
    <div className='mt-8 grid gap-4 md:grid-cols-2'>
      {contactDetails.campuses.map((campus) => (
        <CampusContactCard
          key={campus.name}
          campus={campus}
          onViewMap={onViewMap}
        />
      ))}
    </div>
  );
}

function GeneralEmailSection() {
  return (
    <div className='fgs-panel mt-8'>
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

function AcknowledgementSection() {
  return (
    <section
      aria-label={acknowledgementContent.title}
      className='fgs-section pb-16'
    >
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='border-t border-border pt-5 sm:pt-6'>
          <div className='max-w-4xl'>
            <p className='pb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground/90'>
              {acknowledgementContent.title}
            </p>
            <p className='text-sm leading-7 text-muted-foreground'>
              {acknowledgementContent.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CampusContactCard({
  campus,
  onViewMap,
}: {
  campus: (typeof contactDetails.campuses)[number];
  onViewMap: (campus: (typeof contactDetails.campuses)[number]) => void;
}) {
  return (
    <article id={campus.id} className='fgs-card scroll-mt-24'>
      <h2 className='fgs-subheading'>{campus.name}</h2>
      <div className='mt-4'>
        <p className='text-fgs-ink text-sm font-semibold'>Principal</p>
        <p className='fgs-copy mt-1.5'>{campus.principal}</p>
      </div>
      <div className='mt-4'>
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

      <div className='mt-4'>
        <p className='text-fgs-ink text-sm font-semibold'>Address</p>
        <p className='fgs-copy mt-1.5'>{campus.address}</p>
      </div>

      <button
        type='button'
        className='mt-4 fgs-btn-secondary'
        onClick={() => onViewMap(campus)}
      >
        View Map
      </button>
    </article>
  );
}

function CampusMapModal({
  campus,
  open,
  onOpenChange,
}: {
  campus: (typeof contactDetails.campuses)[number] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader className='items-start text-left'>
          <DialogTitle className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {campus?.name ?? 'Campus Map'}
          </DialogTitle>
        </DialogHeader>

        {campus ? (
          <div className='space-y-4'>
            <div className='overflow-hidden rounded-sm border border-border bg-card'>
              <iframe
                key={campus.id}
                title={`${campus.name} map`}
                src={campus.embedMapUrl}
                loading='lazy'
                referrerPolicy='no-referrer-when-downgrade'
                className='h-[22rem] w-full border-0'
              />
            </div>
            <p className='fgs-copy'>{campus.address}</p>
          </div>
        ) : null}

        <DialogFooter>
          <button
            type='button'
            className='fgs-btn-neutral'
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          {campus ? (
            <a
              className='fgs-btn-secondary'
              href={campus.mapUrl}
              target='_blank'
              rel='noreferrer'
            >
              Open in Google Maps
            </a>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ContactPage() {
  const [activeCampus, setActiveCampus] = useState<
    (typeof contactDetails.campuses)[number] | null
  >(null);

  return (
    <MarketingShell>
      <PageHero
        title={contactPageContent.title}
        description={contactPageContent.description}
        primaryCta={{
          href: '/preview/register',
          label: 'Register With FGS',
        }}
      />

      <section className='fgs-section'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
          <GeneralEmailSection />
          <CampusContactGrid onViewMap={setActiveCampus} />
        </div>
      </section>

      <section className='fgs-section'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
          <OverviewSection
            title={contactPageContent.timingsTitle}
            paragraphs={contactPageContent.timingsParagraphs}
          />
        </div>
      </section>

      <AcknowledgementSection />

      <CampusMapModal
        campus={activeCampus}
        open={!!activeCampus}
        onOpenChange={(open) => {
          if (!open) {
            setActiveCampus(null);
          }
        }}
      />
    </MarketingShell>
  );
}
