import { foundersContent } from '../content';

type FoundersSectionProps = {
  variant?: 'balanced' | 'editorial' | 'split';
};

export default function FoundersSection({
  variant = 'balanced',
}: FoundersSectionProps) {
  const layoutClassName =
    variant === 'editorial'
      ? 'grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'
      : variant === 'split'
        ? 'grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'
        : 'grid gap-6 lg:grid-cols-[1.1fr_0.9fr]';

  const textPanelClassName =
    variant === 'editorial'
      ? 'rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-7'
      : 'rounded-[1.4rem] border border-border bg-card p-6 shadow-sm';

  return (
    <section id='founders' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className={layoutClassName}>
          <article className={textPanelClassName}>
            <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
              Founded in 1978
            </p>
            <h2 className='fgs-heading mt-3'>{foundersContent.title}</h2>
            <div className='mt-5 space-y-4'>
              {foundersContent.paragraphs.map((paragraph) => (
                <p key={paragraph} className='fgs-copy'>
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
            <article className='fgs-card'>
              <div className='fgs-placeholder aspect-[4/5] text-xs'>
                Founder Image Placeholder 1
              </div>
              <p className='fgs-copy mt-3'>
                Honorable Sir Asim Farooqi
              </p>
            </article>
            <article className='fgs-card'>
              <div className='fgs-placeholder aspect-[4/5] text-xs'>
                Founder Image Placeholder 2
              </div>
              <p className='fgs-copy mt-3'>
                Respected Madam Zahida Asim Farooqi
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
