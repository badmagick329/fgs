import { galleryContent } from '../content';

type GallerySectionProps = {
  variant?: 'mosaic' | 'editorial' | 'band';
};

export default function GallerySection({
  variant = 'mosaic',
}: GallerySectionProps) {
  const cards =
    variant === 'editorial'
      ? galleryContent.cards.slice(0, 3)
      : galleryContent.cards;

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
          <p className='fgs-copy hidden max-w-md text-right md:block'>
            {galleryContent.description}
          </p>
        </div>

        <div
          className={
            variant === 'band'
              ? 'mt-6 grid gap-4 md:grid-cols-4'
              : variant === 'editorial'
                ? 'mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'
                : 'mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'
          }
        >
          {variant === 'editorial' ? (
            <>
              <article className='fgs-card'>
                <div className='fgs-placeholder min-h-80 text-sm'>
                  Main Student Life Gallery Placeholder
                </div>
              </article>
              <div className='grid gap-4'>
                {cards.map((card) => (
                  <article key={card} className='fgs-card'>
                    <div className='fgs-placeholder aspect-[16/10] text-xs'>
                      {card}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            cards.map((card, index) => (
              <article
                key={card}
                className={
                  variant === 'band' && index === 0
                    ? 'fgs-card md:col-span-2'
                    : 'fgs-card'
                }
              >
                <div
                  className={
                    variant === 'band' && index === 0
                      ? 'fgs-placeholder min-h-70 text-sm'
                      : 'fgs-placeholder aspect-[4/3] text-xs'
                  }
                >
                  {card}
                </div>
                <p className='fgs-copy mt-3'>{galleryContent.description}</p>
              </article>
            ))
          )}
        </div>

        <p className='fgs-copy mt-4 md:hidden'>{galleryContent.description}</p>
      </div>
    </section>
  );
}
