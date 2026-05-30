'use client';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { heroContent } from '../content';

type ResponsiveHeroSource = {
  sm: string;
  md: string;
  lg: string;
};

const heroPhotos = {
  qsp08932: {
    sm: '/hero-new/qsp08932_sm.webp',
    md: '/hero-new/qsp08932.webp',
    lg: '/hero-new/qsp08932_lg.webp',
  },
  qsp08935: {
    sm: '/hero-new/qsp08935_sm.webp',
    md: '/hero-new/qsp08935.webp',
    lg: '/hero-new/qsp08935_lg.webp',
  },
  qsp08950: {
    sm: '/hero-new/qsp08950_sm.webp',
    md: '/hero-new/qsp08950.webp',
    lg: '/hero-new/qsp08950_lg.webp',
  },
  qsp08963: {
    sm: '/hero-new/qsp08963_sm.webp',
    md: '/hero-new/qsp08963.webp',
    lg: '/hero-new/qsp08963_lg.webp',
  },
  qsp08988: {
    sm: '/hero-new/qsp08988_sm.webp',
    md: '/hero-new/qsp08988.webp',
    lg: '/hero-new/qsp08988_lg.webp',
  },
} as const;

const heroSlides = [
  {
    src: heroPhotos.qsp08988,
    alt: 'Farooqi Grammar School students gathered in a science setting',
  },
  {
    src: heroPhotos.qsp08935,
    alt: 'Farooqi Grammar School students standing together',
  },
  {
    src: heroPhotos.qsp08932,
    alt: 'Farooqi Grammar School students smiling in a hallway',
  },
  {
    src: heroPhotos.qsp08963,
    alt: 'Farooqi Grammar School students doing an activity together',
  },
  {
    src: heroPhotos.qsp08950,
    alt: 'Farooqi Grammar School students reading together',
  },
] as const;

function ResponsiveHeroImage({
  sources,
  alt,
  className,
  priority = false,
}: {
  sources: ResponsiveHeroSource;
  alt: string;
  className: string;
  priority?: boolean;
}) {
  return (
    <div className={className}>
      <Image
        src={sources.sm}
        alt={alt}
        fill
        priority={priority}
        sizes='100vw'
        className='object-cover sm:hidden'
      />
      <Image
        src={sources.md}
        alt={alt}
        fill
        priority={priority}
        sizes='100vw'
        className='hidden object-cover sm:block md:hidden'
      />
      <Image
        src={sources.lg}
        alt={alt}
        fill
        priority={priority}
        sizes='100vw'
        className='hidden object-cover md:block'
      />
    </div>
  );
}

export default function MarketingHero() {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) {
      return;
    }

    const intervalId = window.setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [api]);

  return (
    <section className='bg-fgs-surface'>
      <Carousel
        setApi={setApi}
        opts={{ align: 'start', loop: true }}
        className='relative'
      >
        <CarouselContent className='ml-0'>
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.alt} className='pl-0'>
              <div className='relative overflow-hidden'>
                <div className='relative h-[54vh] min-h-88 sm:h-[70vh] lg:h-[82vh]'>
                  <ResponsiveHeroImage
                    sources={slide.src}
                    alt={slide.alt}
                    priority={slide.src === heroSlides[0].src}
                    className='absolute inset-0 block h-full w-full'
                  />
                  <div className='absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/65 via-black/10 to-transparent' />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className='pointer-events-none absolute inset-x-0 bottom-5 z-10 px-5 sm:bottom-6 sm:px-6'>
          <div className='pointer-events-auto flex flex-wrap gap-3'>
            <a className='fgs-btn-primary' href={heroContent.primaryCta.href}>
              {heroContent.primaryCta.label}
            </a>
          </div>
        </div>
      </Carousel>
    </section>
  );
}
