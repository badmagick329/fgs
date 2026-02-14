import Image from 'next/image';

export default function LandingHero() {
  return (
    <section className='fgs-hero'>
      <div className='mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24'>
        <div className='reveal space-y-6'>
          <p className='inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground'>
            Academic excellence with character
          </p>
          <h1 className='text-4xl font-semibold leading-tight sm:text-5xl'>
            Building future leaders at Farooqi Grammar School.
          </h1>
          <p className='max-w-xl text-base text-muted-foreground sm:text-lg'>
            A values-driven learning environment where students grow in
            knowledge, confidence, and purpose.
          </p>
          <div className='flex flex-wrap gap-3'>
            <a className='fgs-btn-primary' href='#contact'>
              Apply for Admission
            </a>
            <a className='fgs-btn-secondary' href='#campuses'>
              Explore Campuses
            </a>
          </div>
        </div>

        <div className='reveal space-y-4'>
          <div className='rounded-2xl border border-border bg-card p-6 shadow-sm'>
            <Image
              src='/fgs-logo.png'
              alt='FGS logo'
              width={220}
              height={220}
              className='mx-auto h-auto w-35 sm:w-45'
              priority
            />
          </div>
          <div className='fgs-placeholder aspect-16/10'>
            Campus Preview Placeholder
          </div>
        </div>
      </div>
    </section>
  );
}
