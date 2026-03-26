import MarketingFooter from './MarketingFooter';
import MarketingNav from './MarketingNav';
import type { MarketingNavItem } from './types';

type PreviewShellProps = {
  navItems: MarketingNavItem[];
  children: React.ReactNode;
};

export default function PreviewShell({
  navItems,
  children,
}: PreviewShellProps) {
  return (
    <main id='top' className='min-h-screen bg-fgs-surface text-fgs-ink'>
      <MarketingNav items={navItems} />
      {children}
      <MarketingFooter items={navItems} />
    </main>
  );
}
