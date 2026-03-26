import { achievementsContent } from '../content';

export default function HighlightsStrip() {
  return (
    <section className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <h3 className='fgs-subheading mt-2'>{achievementsContent.title}</h3>
        </div>
        <div className='mt-5 grid gap-3 sm:grid-cols-3'>
          {achievementsContent.stats.map((stat) => (
            <div
              key={`${stat.value}-${stat.label}`}
              className='rounded-[1.2rem] border border-border bg-fgs-surface px-4 py-4'
            >
              <p className='text-fgs-ink text-2xl font-semibold leading-none sm:text-3xl'>
                {stat.value}
              </p>
              <p className='text-fgs-ink mt-2 text-sm font-semibold'>
                {stat.label}
              </p>
              {stat.supporting ? (
                <p className='fgs-copy mt-1 text-xs'>{stat.supporting}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
