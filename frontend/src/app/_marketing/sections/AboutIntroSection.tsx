import { aboutIntroContent } from '../content';

export default function AboutIntroSection() {
  return (
    <section id='about' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start'>
          <div>
            <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
              Legacy
            </p>
            <h2 className='fgs-heading mt-3'>{aboutIntroContent.title}</h2>
          </div>
          <div className='space-y-4 rounded-[1.4rem] border border-border bg-card p-6 shadow-sm'>
            {aboutIntroContent.paragraphs.map((paragraph) => (
              <p key={paragraph} className='fgs-copy'>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
