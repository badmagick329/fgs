import LandingFooter from '@/app/_components/LandingFooter';
import NavBar from '@/app/_components/NavBar';
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
      <NavBar items={navItems} />
      {children}
      <LandingFooter items={navItems} />
    </main>
  );
}
