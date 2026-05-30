import MarketingFooter from './MarketingFooter';
import MarketingNav from './MarketingNav';
import type { MarketingNavItem } from './types';

type MarketingShellProps = {
  navItems: MarketingNavItem[];
  children: React.ReactNode;
};

export default function MarketingShell({
  navItems,
  children,
}: MarketingShellProps) {
  return (
    <main id='top' className='fgs-v1 min-h-screen bg-fgs-surface text-fgs-ink'>
      <MarketingNav items={navItems} />
      {children}
      <MarketingFooter items={navItems} />
    </main>
  );
}
