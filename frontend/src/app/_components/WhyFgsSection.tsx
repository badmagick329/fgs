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

const reasons = [
  {
    title: 'Strong Academic Foundation',
    description:
      'At Farooqi Grammar School, we focus on building clear concepts and excellent exam preparation so students achieve strong academic results and lifelong learning habits.',
  },
  {
    title: 'Character with Culture',
    description:
      'The school aims to provide quality English-medium education within our cultural, religious, and historical framework, ensuring students grow with strong values alongside modern knowledge.',
  },
  {
    title: 'Individual Attention',
    description:
      'We believe every child matters. With focused classroom support and caring teachers, students receive the attention they need to succeed.',
  },
  {
    title: 'Affordable Quality Education',
    description:
      'High standards do not have to mean high fees. Farooqi Grammar School is committed to making quality education accessible to families from all backgrounds.',
  },
  {
    title: 'Holistic Development',
    description:
      'Beyond textbooks, students participate in co-curricular activities, competitions and events, confidence-building opportunities, and moral and personality development.',
  },
  {
    title: 'Safe & Nurturing Environment',
    description:
      'We provide a disciplined, respectful, and child-friendly atmosphere where students feel secure and motivated to learn.',
  },
  {
    title: 'Vision for the Future',
    description:
      'Our mission is to empower students with knowledge, confidence, and values so they become responsible and successful members of society.',
  },
];

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
        <h2 className='fgs-heading'>Why Join Farooqi Grammar School?</h2>
        <Carousel
          setApi={setApi}
          plugins={[autoplay.current]}
          opts={{ align: 'start', loop: true }}
          className='mt-6 px-10 sm:px-12'
        >
          <CarouselContent className='items-start'>
            {reasons.map((item) => (
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
