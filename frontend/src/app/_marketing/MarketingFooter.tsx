import type { MarketingNavItem } from './types';

type MarketingFooterProps = {
  items: MarketingNavItem[];
};

export default function MarketingFooter({ items }: MarketingFooterProps) {
  return (
    <footer className='border-t border-border bg-card'>
      <div className='mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8'>
        <nav aria-label='Footer'>
          <ul className='flex flex-wrap gap-4 text-sm'>
            {items.map((item) => (
              <li key={item.id}>
                <a className='fgs-link' href={`#${item.id}`}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className='text-xs text-muted-foreground'>
          &copy; {new Date().getFullYear()} Farooqi Grammar School. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
