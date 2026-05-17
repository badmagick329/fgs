'use client';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useEffect, useState } from 'react';
import GalleryImageCard from '@/app/_marketing/sections/GalleryImageCard';
import { galleryContent } from '../content';

export default function GallerySection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const desktopTopRow =
    galleryContent.images.length === 5
      ? galleryContent.images.slice(0, 3)
      : galleryContent.images;
  const desktopBottomRow =
    galleryContent.images.length === 5 ? galleryContent.images.slice(3) : [];

  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    setCount(api.scrollSnapList().length);
    onSelect();

    api.on('select', onSelect);
    api.on('reInit', onSelect);

    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  return (
    <section id='gallery' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='flex items-end justify-between gap-4'>
          <h2 className='fgs-heading mt-3'>{galleryContent.title}</h2>
        </div>

        {galleryContent.images.length === 5 ? (
          <div className='mt-6 hidden gap-4 xl:block'>
            <div className='grid grid-cols-3 gap-5'>
              {desktopTopRow.map((image) => (
                <GalleryImageCard
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  objectPosition={image.objectPosition}
                />
              ))}
            </div>
            <div className='mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-5'>
              {desktopBottomRow.map((image) => (
                <GalleryImageCard
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  objectPosition={image.objectPosition}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className='mt-6 hidden justify-items-center gap-4 xl:grid xl:grid-cols-4'>
            {galleryContent.images.map((image) => (
              <GalleryImageCard
                key={image.src}
                src={image.src}
                alt={image.alt}
                objectPosition={image.objectPosition}
              />
            ))}
          </div>
        )}

        <div className='xl:hidden'>
          <Carousel
            setApi={setApi}
            opts={{ align: 'start', loop: true }}
            className='mt-6 px-4 sm:px-8 lg:px-10'
          >
            <CarouselContent className='items-start'>
              {galleryContent.images.map((image) => (
                <CarouselItem
                  key={image.src}
                  className='basis-[88%] sm:basis-[70%] md:basis-[52%] lg:basis-[38%]'
                >
                  <GalleryImageCard
                    src={image.src}
                    alt={image.alt}
                    objectPosition={image.objectPosition}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious
              variant='outline'
              size='icon-sm'
              className='left-1 sm:left-0 border-border/80 bg-card text-muted-foreground opacity-80 shadow-none hover:bg-fgs-surface hover:text-foreground hover:opacity-100'
            />
            <CarouselNext
              variant='outline'
              size='icon-sm'
              className='right-1 sm:right-0 border-border/80 bg-card text-muted-foreground opacity-80 shadow-none hover:bg-fgs-surface hover:text-foreground hover:opacity-100'
            />
          </Carousel>
          <div className='mt-4 flex items-center justify-center gap-2'>
            {Array.from({ length: count }).map((_, index) => {
              const isActive = index === current;

              return (
                <button
                  key={`gallery-dot-${index}`}
                  type='button'
                  aria-label={`Go to gallery slide ${index + 1}`}
                  onClick={() => api?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all ${
                    isActive
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-border hover:bg-muted-foreground/40'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
