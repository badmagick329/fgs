import { acknowledgementContent } from '../content';

export default function AcknowledgementSection() {
  return (
    <section
      aria-label={acknowledgementContent.title}
      className='fgs-section pb-8 sm:pb-10'
    >
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='border-t border-border pt-5 sm:pt-6'>
          <div className='max-w-4xl'>
            <p className='text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground/90 pb-2'>
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
