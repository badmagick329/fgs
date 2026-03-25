import { achievementsContent } from '../content';

type AchievementsSectionProps = {
  variant?: 'grid' | 'band' | 'compact';
  sectionId?: string;
};

export default function AchievementsSection({
  variant = 'grid',
  sectionId,
}: AchievementsSectionProps) {
  const wrapperClassName =
    variant === 'band'
      ? 'rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-7'
      : variant === 'compact'
        ? 'rounded-[1.4rem] border border-border bg-card p-5 shadow-sm sm:p-6'
        : '';

  const inner = (
    <>
      <div className='space-y-3'>
        <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
          Proof Points
        </p>
        <h2 className='fgs-heading'>{achievementsContent.title}</h2>
        <p className='fgs-copy max-w-2xl'>{achievementsContent.description}</p>
      </div>
      <div className='mt-6 flex flex-wrap gap-2 text-sm'>
        {achievementsContent.chips.map((chip) => (
          <span key={chip} className='fgs-chip'>
            {chip}
          </span>
        ))}
      </div>
    </>
  );

  return (
    <section id={sectionId} className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        {wrapperClassName ? <div className={wrapperClassName}>{inner}</div> : inner}
      </div>
    </section>
  );
}
