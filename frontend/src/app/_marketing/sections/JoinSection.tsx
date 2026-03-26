import { joinContent } from '../content';

export default function JoinSection() {
  return (
    <section id='join' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>{joinContent.title}</h2>
        <div className='mt-6 grid gap-4 lg:grid-cols-2'>
          {joinContent.cards.map((card) => (
            <article key={card.title} className='fgs-card'>
              <h3 className='fgs-subheading'>{card.title}</h3>
              <p className='fgs-copy mt-2'>{card.description}</p>
              <a
                className={`${card.cta.className} mt-4 inline-flex`}
                href={card.cta.href}
              >
                {card.cta.label}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
