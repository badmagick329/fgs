import { achievementsContent } from '../content';

export default function AchievementsSection() {
  return (
    <div className='fgs-panel mt-4'>
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
