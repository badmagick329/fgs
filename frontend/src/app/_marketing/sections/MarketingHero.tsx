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

type MarketingHeroProps = {
  heroVariant?: string;
};

const validHeroVariants = ['1', '2'] as const;
type HeroVariant = (typeof validHeroVariants)[number];

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
  qsp08973: {
    sm: '/hero-new/qsp08973_sm.webp',
    md: '/hero-new/qsp08973.webp',
    lg: '/hero-new/qsp08973_lg.webp',
  },
  qsp08988: {
    sm: '/hero-new/qsp08988_sm.webp',
    md: '/hero-new/qsp08988.webp',
    lg: '/hero-new/qsp08988_lg.webp',
  },
  qsp08991: {
    sm: '/hero-new/qsp08991_sm.webp',
    md: '/hero-new/qsp08991.webp',
    lg: '/hero-new/qsp08991_lg.webp',
  },
} as const;

const heroFiveSlides = [
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

function resolveHeroVariant(value: string | undefined): HeroVariant | null {
  return validHeroVariants.includes(value as HeroVariant)
    ? (value as HeroVariant)
    : null;
}

function HeroCopy({
  tonedDown = false,
  mobileOverlay = false,
}: {
  tonedDown?: boolean;
  mobileOverlay?: boolean;
}) {
  return (
    <div
      className={`reveal space-y-6 ${tonedDown ? 'max-w-2xl space-y-5' : ''} ${mobileOverlay ? 'relative z-20 max-w-full space-y-5' : ''}`}
    >
      {!tonedDown ? (
        <p className='inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground'>
          {heroContent.eyebrow}
        </p>
      ) : null}
      <h1
        className={`${mobileOverlay ? 'max-w-[11.5ch] text-[2.6rem] leading-[0.98] text-white sm:text-[3rem]' : tonedDown ? 'max-w-[11ch] text-[2.95rem] leading-[1.02] sm:max-w-[10.2ch] sm:text-[2.95rem]' : 'text-4xl sm:text-5xl'} font-semibold leading-tight`}
      >
        {heroContent.title}
      </h1>
      <p
        className={`text-base text-muted-foreground ${mobileOverlay ? 'max-w-[22rem] text-[0.98rem] leading-7 text-white/88 sm:max-w-[24rem]' : tonedDown ? 'max-w-lg sm:max-w-md sm:text-[0.98rem]' : 'max-w-xl sm:text-lg'}`}
      >
        {heroContent.description}
      </p>
      <div className='flex flex-wrap gap-3'>
        <a className='fgs-btn-primary' href={heroContent.primaryCta.href}>
          {heroContent.primaryCta.label}
        </a>
        {!tonedDown ? (
          <a className='fgs-btn-secondary' href={heroContent.secondaryCta.href}>
            {heroContent.secondaryCta.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}

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
    <picture className={className}>
      <source media='(min-width: 768px)' srcSet={sources.lg} />
      <source media='(min-width: 640px)' srcSet={sources.md} />
      <img
        src={sources.sm}
        alt={alt}
        fetchPriority={priority ? 'high' : undefined}
        className='h-full w-full object-cover'
      />
    </picture>
  );
}

function HeroPhoto({
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
    <div
      className={`overflow-hidden rounded-[1.4rem] border border-border bg-card shadow-sm ${className}`}
    >
      <ResponsiveHeroImage
        sources={sources}
        alt={alt}
        className='block h-full w-full'
        priority={priority}
      />
    </div>
  );
}

function DefaultHeroVisual() {
  return (
    <div className='rounded-[1.75rem] border border-border bg-card p-8 shadow-sm sm:p-10'>
      <Image
        src='/fgs-logo.png'
        alt='FGS logo'
        width={220}
        height={220}
        className='mx-auto h-auto w-44 sm:w-52'
        priority
      />
    </div>
  );
}

function PosterCollageHeroVisual() {
  return (
    <>
      <div className='relative hidden min-h-[42rem] lg:block'>
        <HeroPhoto
          sources={heroPhotos.qsp08935}
          alt='Farooqi Grammar School students standing together'
          className='absolute bottom-0 right-0 z-10 aspect-[4/5] w-[78%] rounded-[1.8rem] shadow-lg'
          priority
        />
        <HeroPhoto
          sources={heroPhotos.qsp08963}
          alt='Farooqi Grammar School students doing an activity together'
          className='absolute -left-[4%] top-0 z-20 aspect-4/3 w-[42%] rotate-[-4deg] rounded-[1.55rem] shadow-md'
        />
        <HeroPhoto
          sources={heroPhotos.qsp08950}
          alt='Farooqi Grammar School students reading together'
          className='absolute bottom-3 left-[12%] z-20 aspect-4/3 w-[38%] rotate-[3deg] rounded-[1.55rem] shadow-md'
        />
      </div>
    </>
  );
}

function HeroFiveCarousel() {
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
    <div className='reveal'>
      <Carousel
        setApi={setApi}
        opts={{ align: 'start', loop: true }}
        className='relative'
      >
        <CarouselContent className='ml-0'>
          {heroFiveSlides.map((slide) => (
            <CarouselItem key={slide.alt} className='pl-0'>
              <div className='relative overflow-hidden'>
                <div className='relative h-[65vh] min-h-[28rem] sm:h-[70vh] lg:h-[82vh]'>
                  <ResponsiveHeroImage
                    sources={slide.src}
                    alt={slide.alt}
                    priority={slide.src === heroFiveSlides[0].src}
                    className='absolute inset-0 block h-full w-full'
                  />
                  <div className='absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/45 via-black/10 to-transparent' />
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
    </div>
  );
}

function HeroVisual({ variant }: { variant: HeroVariant | null }) {
  if (variant === '1') return <HeroFiveCarousel />;
  if (variant === '2') return <PosterCollageHeroVisual />;

  return <DefaultHeroVisual />;
}

export default function MarketingHero({ heroVariant }: MarketingHeroProps) {
  const variant = resolveHeroVariant(heroVariant);
  const heroClassName =
    variant === '1'
      ? 'bg-fgs-surface'
      : variant === '2'
        ? 'fgs-hero relative overflow-hidden bg-[radial-gradient(circle_at_10%_20%,rgb(0_144_208_/_14%),transparent_26%),radial-gradient(circle_at_88%_14%,rgb(240_176_32_/_16%),transparent_22%),linear-gradient(135deg,#ffffff,var(--fgs-surface))]'
        : 'fgs-hero';

  if (variant === '1') {
    return (
      <section className={heroClassName}>
        <div className='w-full px-0'>
          <HeroVisual variant={variant} />
        </div>
      </section>
    );
  }

  if (variant === '2') {
    return (
      <section className={heroClassName}>
        <div className='relative overflow-hidden lg:hidden'>
          <div className='relative min-h-[38rem] sm:min-h-[42rem]'>
            <ResponsiveHeroImage
              sources={heroPhotos.qsp08935}
              alt='Farooqi Grammar School students standing together'
              priority
              className='absolute inset-0 block h-full w-full'
            />
            <div className='absolute inset-0 bg-black/62' />
            <div className='relative z-10 flex min-h-[38rem] items-end px-4 py-8 sm:min-h-[42rem] sm:px-6 sm:py-10'>
              <HeroCopy tonedDown mobileOverlay />
            </div>
          </div>
        </div>

        <div className='mx-auto hidden max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-20'>
          <HeroCopy tonedDown />

          <div className='reveal'>
            <HeroVisual variant={variant} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={heroClassName}>
      <div
        className={`mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 lg:px-8 lg:py-20 ${variant === '2' ? 'lg:grid-cols-[0.72fr_1.28fr]' : 'lg:grid-cols-[1.02fr_0.98fr]'}`}
      >
        <HeroCopy tonedDown={variant === '2'} />

        <div className='reveal'>
          <HeroVisual variant={variant} />
        </div>
      </div>
    </section>
  );
}
