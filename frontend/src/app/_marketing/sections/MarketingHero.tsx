import Image from 'next/image';
import { heroContent } from '../content';

export default function MarketingHero() {
  return (
    <section className='fgs-hero'>
      <div className='mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20'>
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
            <a
              className='fgs-btn-secondary'
              href={heroContent.secondaryCta.href}
            >
              {heroContent.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className='reveal'>
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
        </div>
      </div>
    </section>
  );
}
