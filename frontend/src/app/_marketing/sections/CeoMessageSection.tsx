import { ceoMessageContent, ceoMessageSections } from '../content';

export default function CeoMessageSection() {
  return (
    <section id='ceo-message' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='space-y-4'>
          <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
            Leadership
          </p>
          <h2 className='fgs-heading'>{ceoMessageContent.title}</h2>
          <p className='fgs-copy max-w-2xl'>
            Academic excellence, character formation, and a thoughtful approach
            to modern education.
          </p>
        </div>
        <article className='mt-6 rounded-[1.4rem] border border-border bg-card p-6 shadow-sm sm:p-7'>
          <div className='space-y-6'>
            {ceoMessageSections.map((section, index) => (
              <div
                key={section.title}
                className={index > 0 ? 'border-t border-border pt-6' : ''}
              >
                <h3 className='fgs-subheading'>{section.title}</h3>
                <div className='mt-3 space-y-4'>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className='fgs-copy'>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
