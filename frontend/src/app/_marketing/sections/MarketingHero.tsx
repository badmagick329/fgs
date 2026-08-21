'use client';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { heroContent } from '../content';

const AUTOPLAY_INTERVAL_MS = 5000;

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
  onLoad,
  imageContainerRef,
}: {
  sources: ResponsiveHeroSource;
  alt: string;
  className: string;
  priority?: boolean;
  onLoad?: () => void;
  imageContainerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={imageContainerRef} className={className}>
      <Image
        src={sources.sm}
        alt={alt}
        fill
        priority={priority}
        sizes='100vw'
        className='object-cover sm:hidden'
        onLoad={onLoad}
      />
      <Image
        src={sources.md}
        alt={alt}
        fill
        priority={priority}
        sizes='100vw'
        className='hidden object-cover sm:block md:hidden'
        onLoad={onLoad}
      />
      <Image
        src={sources.lg}
        alt={alt}
        fill
        priority={priority}
        sizes='100vw'
        className='hidden object-cover md:block'
        onLoad={onLoad}
      />
    </div>
  );
}

export default function MarketingHero({
  overlayLines,
}: {
  overlayLines?: readonly string[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isInitialSlideReady, setIsInitialSlideReady] = useState(false);
  const autoplayIntervalRef = useRef<number | undefined>(undefined);
  const initialSlideImageRef = useRef<HTMLDivElement>(null);

  const nextSlideIndex = (activeSlideIndex + 1) % heroSlides.length;

  useEffect(() => {
    const visibleInitialImage = Array.from(
      initialSlideImageRef.current?.querySelectorAll('img') ?? []
    ).find((image) => image.offsetWidth > 0 && image.offsetHeight > 0);

    if (visibleInitialImage?.complete && visibleInitialImage.naturalWidth > 0) {
      setIsInitialSlideReady(true);
    }
  }, []);

  useEffect(() => {
    if (!api || !isInitialSlideReady) {
      return;
    }

    const stopAutoplay = () => {
      if (autoplayIntervalRef.current !== undefined) {
        window.clearInterval(autoplayIntervalRef.current);
        autoplayIntervalRef.current = undefined;
      }
    };

    const startAutoplay = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      stopAutoplay();
      autoplayIntervalRef.current = window.setInterval(() => {
        api.scrollNext();
      }, AUTOPLAY_INTERVAL_MS);
    };

    const handleSelect = () => {
      setActiveSlideIndex(api.selectedScrollSnap());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopAutoplay();
        return;
      }

      api.reInit();
      handleSelect();
      startAutoplay();
    };

    handleSelect();
    startAutoplay();
    api.on('select', handleSelect);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopAutoplay();
      api.off('select', handleSelect);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [api, isInitialSlideReady]);

  return (
    <section className='bg-fgs-surface'>
      <Carousel
        setApi={setApi}
        opts={{ align: 'start', loop: true }}
        className={`relative ${isInitialSlideReady ? '' : 'invisible'}`}
      >
        <CarouselContent className='ml-0'>
          {heroSlides.map((slide, index) => (
            <CarouselItem key={slide.alt} className='pl-0'>
              <div className='relative overflow-hidden'>
                <div className='relative h-[54vh] min-h-88 sm:h-[70vh] lg:h-[82vh]'>
                  <ResponsiveHeroImage
                    sources={slide.src}
                    alt={slide.alt}
                    priority={
                      index === activeSlideIndex || index === nextSlideIndex
                    }
                    className='absolute inset-0 block h-full w-full'
                    imageContainerRef={
                      index === 0 ? initialSlideImageRef : undefined
                    }
                    onLoad={
                      index === 0
                        ? () => setIsInitialSlideReady(true)
                        : undefined
                    }
                  />
                  <div className='absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/65 via-black/10 to-transparent' />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {overlayLines ? (
          <div className='pointer-events-none absolute inset-x-0 bottom-5 z-10 px-5 max-[20rem]:px-3 sm:bottom-6 sm:px-6 lg:px-8'>
            <div className='mx-auto max-w-7xl'>
              <div className='pointer-events-auto w-full max-w-2xl rounded-sm bg-black/45 px-7 py-5 shadow-lg backdrop-blur-[2px] max-[20rem]:px-4 sm:w-fit sm:px-9 sm:py-6'>
                <h1 className='text-2xl font-semibold leading-tight text-white max-[20rem]:text-[clamp(1.125rem,7.5vw,1.25rem)] sm:text-4xl'>
                  {overlayLines.map((line, index) => (
                    <span
                      key={line}
                      className={index === 0 ? 'block' : 'mt-1 block'}
                    >
                      {line}
                    </span>
                  ))}
                </h1>
                <a
                  className='fgs-btn-primary mt-5 max-[20rem]:px-4 max-[20rem]:text-sm'
                  href={heroContent.primaryCta.href}
                >
                  {heroContent.primaryCta.label}
                </a>
              </div>
            </div>
          </div>
        ) : null}

        {!overlayLines ? (
          <div className='pointer-events-none absolute inset-x-0 bottom-5 z-10 px-5 sm:bottom-6 sm:px-6'>
            <div className='pointer-events-auto flex flex-wrap gap-3'>
              <a className='fgs-btn-primary' href={heroContent.primaryCta.href}>
                {heroContent.primaryCta.label}
              </a>
            </div>
          </div>
        ) : null}
      </Carousel>
    </section>
  );
}
