import GalleryImageCard from '@/app/_marketing/sections/GalleryImageCard';
import { galleryContent } from '../content';

export default function GallerySection() {
  return (
    <section id='gallery' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='flex items-end justify-between gap-4'>
          <h2 className='fgs-heading mt-3'>{galleryContent.title}</h2>
        </div>

        <div className='mt-6 grid justify-items-center gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {galleryContent.images.map((image) => (
            <GalleryImageCard
              key={image.src}
              src={image.src}
              alt={image.alt}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
