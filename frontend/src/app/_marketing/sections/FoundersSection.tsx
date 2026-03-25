import {
  achievementsContent,
  foundersContent,
  foundersStorySections,
} from '../content';

export default function FoundersSection() {
  return (
    <section id='about' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='space-y-4'>
          <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
            Institution
          </p>
          <h2 className='fgs-heading'>About Farooqi Grammar School</h2>
          <p className='fgs-copy'>
            Farooqi Grammar School has grown through trust, discipline, and a
            long-standing commitment to quality education rooted in values and
            service.
          </p>
        </div>
        <div className='mt-6 rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-7'>
          <div className='space-y-4'>
            <h3 className='fgs-subheading'>{foundersContent.title}</h3>
            {foundersStorySections.map((section, index) => (
              <div
                key={section.title}
                className={index > 0 ? 'border-t border-border pt-4' : ''}
              >
                <h4 className='text-fgs-ink text-sm font-semibold'>
                  {section.title}
                </h4>
                <div className='mt-2 space-y-3'>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className='fgs-copy'>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className='mt-6 grid gap-4 sm:grid-cols-2'>
            <div className='rounded-3xl border border-border bg-card p-3 shadow-sm'>
              <div className='fgs-placeholder mx-auto aspect-square max-w-[16rem] text-xs'>
                Founder Image Placeholder 1
              </div>
              <p className='fgs-copy mt-3 mx-auto max-w-[16rem] text-center'>
                Honorable Sir Asim Farooqi
              </p>
            </div>
            <div className='rounded-3xl border border-border bg-card p-3 shadow-sm'>
              <div className='fgs-placeholder mx-auto aspect-square max-w-[16rem] text-xs'>
                Founder Image Placeholder 2
              </div>
              <p className='fgs-copy mt-3 mx-auto max-w-[16rem] text-center'>
                Respected Madam Zahida Asim Farooqi
              </p>
            </div>
          </div>
        </div>
        <div className='mt-4 rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-7'>
          <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
            School Highlights
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
    </section>
  );
}
