import Link from 'next/link';
import type { SiteNavItem } from './types';

type MarketingFooterProps = {
  items: SiteNavItem[];
};

export default function MarketingFooter({ items }: MarketingFooterProps) {
  return (
    <footer className='border-t border-border bg-card'>
      <div className='mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8'>
        <nav aria-label='Footer'>
          <ul className='flex flex-wrap gap-4 text-sm'>
            {items.map((item) => (
              <li key={item.href}>
                <Link className='fgs-link' href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className='flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
          <p>
            &copy; {new Date().getFullYear()} Farooqi Grammar School. All rights
            reserved.
          </p>
          <p>
            Built by{' '}
            <Link
              href='/about#acknowledgement'
              className='rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fgs-blue'
            >
              Uzair Farooqi
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
