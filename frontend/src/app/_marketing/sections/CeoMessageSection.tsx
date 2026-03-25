import { ceoMessageContent } from '../content';

type CeoMessageSectionProps = {
  variant?: 'balanced' | 'editorial' | 'spotlight';
};

export default function CeoMessageSection({
  variant = 'balanced',
}: CeoMessageSectionProps) {
  const containerClassName =
    variant === 'editorial'
      ? 'grid gap-6 lg:grid-cols-[0.82fr_1.18fr]'
      : variant === 'spotlight'
        ? 'grid gap-6 lg:grid-cols-[1.05fr_0.95fr]'
        : 'grid gap-6 lg:grid-cols-[0.9fr_1.1fr]';

  const panelClassName =
    variant === 'spotlight'
      ? 'rounded-[1.8rem] border border-border bg-white p-7 shadow-[0_18px_50px_rgb(15_26_42/0.08)] sm:p-8'
      : 'rounded-[1.4rem] border border-border bg-card p-6 shadow-sm sm:p-7';

  return (
    <section id='ceo-message' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className={containerClassName}>
          <div className='space-y-4'>
            <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
              Leadership
            </p>
            <h2 className='fgs-heading'>{ceoMessageContent.title}</h2>
            <p className='fgs-copy max-w-sm'>
              A message about academic standards, character formation, and a
              thoughtful approach to modern education.
            </p>
          </div>
          <article className={panelClassName}>
            <div className='space-y-4'>
              {ceoMessageContent.paragraphs.map((paragraph) => (
                <p key={paragraph} className='fgs-copy'>
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
