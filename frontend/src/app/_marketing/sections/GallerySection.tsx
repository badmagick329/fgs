import { galleryContent } from '../content';

export default function GallerySection() {
  return (
    <section id='gallery' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <p className='text-brand-blue text-xs font-semibold uppercase tracking-[0.24em]'>
              Visual Story
            </p>
            <h2 className='fgs-heading mt-3'>{galleryContent.title}</h2>
          </div>
        </div>

        <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {galleryContent.cards.map((card) => (
            <article key={card} className='fgs-card'>
              <div className='fgs-placeholder aspect-[4/3] text-xs'>
                {card}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
