import { achievementsContent, foundersContent } from '../content';

export default function AboutOverviewSection() {
  return (
    <section id='about' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='grid gap-4 lg:grid-cols-[1.25fr_0.75fr]'>
          <div className='rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-7'>
            <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
              Institution
            </p>
            <h2 className='fgs-heading mt-3'>About Farooqi Grammar School</h2>
            <p className='fgs-copy mt-4'>
              Farooqi Grammar School has grown through trust, discipline, and a
              long-standing commitment to quality education rooted in values and
              service.
            </p>
            <div className='mt-6 space-y-4'>
              <h3 className='fgs-subheading'>{foundersContent.title}</h3>
              {foundersContent.paragraphs.map((paragraph) => (
                <p key={paragraph} className='fgs-copy'>
                  {paragraph}
                </p>
              ))}
            </div>
            <div className='mt-6 grid gap-4 sm:grid-cols-2'>
              <div className='fgs-card'>
                <div className='fgs-placeholder aspect-[4/5] text-xs'>
                  Founder Image Placeholder 1
                </div>
                <p className='fgs-copy mt-3'>Honorable Sir Asim Farooqi</p>
              </div>
              <div className='fgs-card'>
                <div className='fgs-placeholder aspect-[4/5] text-xs'>
                  Founder Image Placeholder 2
                </div>
                <p className='fgs-copy mt-3'>
                  Respected Madam Zahida Asim Farooqi
                </p>
              </div>
            </div>
          </div>
          <div className='rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-7'>
            <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
              Proof Points
            </p>
            <h3 className='fgs-subheading mt-3'>{achievementsContent.title}</h3>
            <p className='fgs-copy mt-3'>{achievementsContent.description}</p>
            <div className='mt-5 flex flex-wrap gap-2 text-sm'>
              {achievementsContent.chips.map((chip) => (
                <span key={chip} className='fgs-chip'>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
