import Image from 'next/image';
import Link from 'next/link';
import type { SiteNavItem } from './types';

type MarketingNavProps = {
  items: SiteNavItem[];
};

export default function MarketingNav({ items }: MarketingNavProps) {
  return (
    <header className='sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-sm'>
      <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8'>
        <Link href='/preview' className='flex items-center gap-3'>
          <Image
            src='/fgs-logo.png'
            alt='Farooqi Grammar School logo'
            width={44}
            height={44}
            className='h-11 w-11 rounded-md bg-white object-cover'
            priority
          />
          <span className='text-fgs-ink text-sm font-semibold leading-tight sm:text-base'>
            Farooqi Grammar School
          </span>
        </Link>

        <nav className='hidden md:block' aria-label='Primary'>
          <ul className='flex items-center gap-6 text-sm font-medium'>
            {items.map((item) => (
              <li key={item.href}>
                <Link className='fgs-link' href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <details className='group md:hidden'>
          <summary className='text-fgs-ink cursor-pointer list-none rounded-md border border-border px-3 py-2 text-sm font-medium'>
            Menu
          </summary>
          <nav
            className='absolute right-4 top-17 w-52 rounded-xl border border-border bg-card p-2 shadow-xl'
            aria-label='Mobile'
          >
            <ul className='flex flex-col'>
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    className='text-fgs-ink hover:bg-fgs-surface block rounded-lg px-3 py-2 text-sm'
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
