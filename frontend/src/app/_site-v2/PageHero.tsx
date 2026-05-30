import Link from 'next/link';

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta?: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
};

export default function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: PageHeroProps) {
  return (
    <section className='fgs-hero'>
      <div className='mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20'>
        <div className='max-w-3xl space-y-6'>
          {eyebrow ? (
            <p className='inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground'>
              {eyebrow}
            </p>
          ) : null}
          <h1 className='text-4xl font-semibold leading-tight sm:text-5xl'>
            {title}
          </h1>
          <p className='max-w-2xl text-base text-muted-foreground sm:text-lg'>
            {description}
          </p>
          {primaryCta || secondaryCta ? (
            <div className='flex flex-wrap gap-3'>
              {primaryCta ? (
                <Link className='fgs-btn-primary' href={primaryCta.href}>
                  {primaryCta.label}
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link className='fgs-btn-secondary' href={secondaryCta.href}>
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
