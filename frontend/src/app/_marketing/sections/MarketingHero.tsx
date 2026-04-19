import Image from 'next/image';
import {
  achievementsContent,
  galleryContent,
  heroContent,
} from '../content';

type MarketingHeroProps = {
  heroVariant?: string;
};

const validHeroVariants = ['1', '2', '3', '4'] as const;
type HeroVariant = (typeof validHeroVariants)[number];

function resolveHeroVariant(value: string | undefined): HeroVariant | null {
  return validHeroVariants.includes(value as HeroVariant)
    ? (value as HeroVariant)
    : null;
}

function HeroCopy() {
  return (
    <div className='reveal space-y-6'>
      <p className='inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground'>
        {heroContent.eyebrow}
      </p>
      <h1 className='text-4xl font-semibold leading-tight sm:text-5xl'>
        {heroContent.title}
      </h1>
      <p className='max-w-xl text-base text-muted-foreground sm:text-lg'>
        {heroContent.description}
      </p>
      <div className='flex flex-wrap gap-3'>
        <a className='fgs-btn-primary' href={heroContent.primaryCta.href}>
          {heroContent.primaryCta.label}
        </a>
        <a className='fgs-btn-secondary' href={heroContent.secondaryCta.href}>
          {heroContent.secondaryCta.label}
        </a>
      </div>
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

function BadgeHeroVisual() {
  return (
    <div className='relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm sm:p-10'>
      <div className='absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/25' />
      <div className='absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-brand-blue/15' />
      <div className='relative mx-auto flex max-w-xs flex-col items-center text-center'>
        <Image
          src='/fgs-logo.png'
          alt='FGS logo'
          width={180}
          height={180}
          className='h-auto w-32 sm:w-40'
          priority
        />
        <p className='mt-6 rounded-full bg-fgs-surface px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
          Established 1978
        </p>
        <p className='mt-4 text-2xl font-semibold text-fgs-ink'>
          A legacy of academic excellence
        </p>
        <p className='mt-3 text-sm leading-6 text-muted-foreground'>
          47 Lahore Board positions and generations of Farooqi alumni.
        </p>
      </div>
    </div>
  );
}

function AbstractHeroVisual() {
  return (
    <div className='relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm sm:p-10'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(0_144_208_/_18%),transparent_32%),radial-gradient(circle_at_80%_75%,rgb(240_176_32_/_24%),transparent_34%)]' />
      <div className='absolute left-8 top-8 h-24 w-24 rounded-3xl border border-brand-blue/20 bg-brand-blue/10' />
      <div className='absolute bottom-8 right-8 h-28 w-28 rounded-full border border-primary/40 bg-primary/20' />
      <div className='relative mx-auto max-w-sm rounded-[1.5rem] border border-border/80 bg-white/75 p-6 text-center backdrop-blur sm:p-8'>
        <div className='mx-auto max-w-xs'>
          <Image
            src='/fgs-logo.png'
            alt='FGS logo'
            width={180}
            height={180}
            className='mx-auto h-auto w-32 sm:w-40'
            priority
          />
          <p className='mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
            Since 1978
          </p>
          <p className='mt-3 text-2xl font-semibold leading-tight text-fgs-ink'>
            47 board positions. 50,000+ alumni.
          </p>
          <p className='mt-3 text-sm leading-6 text-muted-foreground'>
            A long-standing Lahore school built on achievement, character, and
            trust.
          </p>
        </div>
      </div>
    </div>
  );
}

function GalleryCollageHeroVisual() {
  const images = galleryContent.images.slice(0, 5);

  return (
    <div className='relative min-h-[24rem] rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6'>
      <div className='absolute bottom-5 left-5 z-10 max-w-56 rounded-2xl border border-border bg-white/90 p-4 shadow-sm backdrop-blur'>
        <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
          Since 1978
        </p>
        <p className='mt-2 text-lg font-semibold leading-tight text-fgs-ink'>
          Student life with a legacy behind it.
        </p>
        <div className='mt-3 flex flex-wrap gap-1.5'>
          {achievementsContent.chips.slice(0, 2).map((chip) => (
            <span key={chip} className='fgs-chip text-xs'>
              {chip}
            </span>
          ))}
        </div>
      </div>
      {images.map((image, index) => {
        const positions = [
          'left-4 top-6 w-44 rotate-[-5deg]',
          'right-5 top-4 w-40 rotate-[4deg]',
          'left-12 top-36 w-48 rotate-[3deg]',
          'right-10 top-40 w-44 rotate-[-4deg]',
          'left-1/2 top-24 w-36 -translate-x-1/2 rotate-[1deg]',
        ];

        return (
          <div
            key={image.src}
            className={`absolute overflow-hidden rounded-2xl border border-border bg-fgs-surface shadow-sm ${positions[index]}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={320}
              height={240}
              className='aspect-4/3 h-auto w-full object-cover'
            />
          </div>
        );
      })}
    </div>
  );
}

function LegacyHeroVisual() {
  return (
    <div className='relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm sm:p-10'>
      <p className='pointer-events-none absolute -right-4 top-4 text-8xl font-semibold leading-none text-brand-blue/[0.07] sm:text-9xl'>
        1978
      </p>
      <div className='absolute -left-12 bottom-6 h-32 w-32 rounded-full bg-primary/20' />
      <div className='absolute right-10 top-10 h-20 w-20 rounded-3xl border border-brand-blue/20 bg-brand-blue/10 rotate-12' />
      <div className='relative rounded-[1.5rem] bg-fgs-surface/90 p-6 sm:p-8'>
        <div className='flex flex-col gap-6 sm:flex-row sm:items-center'>
          <Image
            src='/fgs-logo.png'
            alt='FGS logo'
            width={150}
            height={150}
            className='h-auto w-28 shrink-0 sm:w-32'
            priority
          />
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
              Since 1978
            </p>
            <p className='mt-2 text-3xl font-semibold leading-tight text-fgs-ink'>
              A tradition of disciplined learning.
            </p>
          </div>
        </div>
        <p className='mt-6 max-w-sm text-base leading-7 text-muted-foreground'>
          Built on commitment, discipline, trust, and a long-standing tradition
          of educational service.
        </p>
        <div className='mt-6 grid gap-2 sm:grid-cols-3'>
          {achievementsContent.chips.map((chip) => (
            <span
              key={chip}
              className='rounded-xl border border-border bg-card px-3 py-2 text-center text-xs font-semibold text-fgs-ink'
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroVisual({ variant }: { variant: HeroVariant | null }) {
  if (variant === '1') return <BadgeHeroVisual />;
  if (variant === '2') return <AbstractHeroVisual />;
  if (variant === '3') return <GalleryCollageHeroVisual />;
  if (variant === '4') return <LegacyHeroVisual />;

  return <DefaultHeroVisual />;
}

export default function MarketingHero({ heroVariant }: MarketingHeroProps) {
  const variant = resolveHeroVariant(heroVariant);
  const heroClassName =
    variant === '2'
      ? 'fgs-hero relative overflow-hidden bg-[radial-gradient(circle_at_82%_10%,rgb(0_144_208_/_24%),transparent_26%),radial-gradient(circle_at_12%_85%,rgb(240_176_32_/_22%),transparent_30%),linear-gradient(135deg,#ffffff,var(--fgs-surface))]'
      : 'fgs-hero';

  return (
    <section className={heroClassName}>
      <div className='mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20'>
        <HeroCopy />

        <div className='reveal'>
          <HeroVisual variant={variant} />
        </div>
      </div>
    </section>
  );
}
