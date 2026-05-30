import MarketingFooter from './MarketingFooter';
import MarketingNav from './MarketingNav';
import { marketingNavItems } from './content';

type MarketingShellProps = {
  children: React.ReactNode;
};

export default function MarketingShell({ children }: MarketingShellProps) {
  return (
    <main className='min-h-screen bg-fgs-surface text-fgs-ink'>
      <MarketingNav items={marketingNavItems} />
      {children}
      <MarketingFooter items={marketingNavItems} />
    </main>
  );
}
