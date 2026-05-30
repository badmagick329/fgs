'use client';

import GalleryBlock from './GalleryBlock';

export default function GallerySection() {
  return (
    <section id='gallery' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <GalleryBlock />
      </div>
    </section>
  );
}
