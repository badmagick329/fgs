import { achievementsContent } from '../content';

export default function AchievementsSection() {
  return (
    <div className='mt-4 rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-7'>
      <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
        School Highlights
      </p>
      <h3 className='fgs-subheading mt-3'>{achievementsContent.title}</h3>
      <div className='mt-5 flex flex-wrap gap-2 text-sm'>
        {achievementsContent.chips.map((chip) => (
          <span key={chip} className='fgs-chip'>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
