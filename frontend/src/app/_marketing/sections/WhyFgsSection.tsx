'use client';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useRef, useState } from 'react';
import { whyFgsContent } from '../content';

export default function WhyFgsSection() {
  const autoplay = useRef(
    Autoplay({
      delay: 5000,
      stopOnMouseEnter: true,
      stopOnInteraction: true,
      stopOnFocusIn: true,
    })
  );
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

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
    <section id='why-fgs' className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <h2 className='fgs-heading'>{whyFgsContent.title}</h2>
        <Carousel
          setApi={setApi}
          plugins={[autoplay.current]}
          opts={{ align: 'start', loop: true }}
          className='mt-6 px-10 sm:px-12'
        >
          <CarouselContent className='items-start'>
            {whyFgsContent.reasons.map((item) => (
              <CarouselItem
                key={item.title}
                className='basis-full sm:basis-1/2 lg:basis-1/3'
              >
                <article className='fgs-card'>
                  <h3 className='fgs-subheading'>{item.title}</h3>
                  <p className='fgs-copy mt-2'>{item.description}</p>
                </article>
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
                key={`why-fgs-dot-${index}`}
                type='button'
                aria-label={`Go to slide ${index + 1}`}
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
    </section>
  );
}
