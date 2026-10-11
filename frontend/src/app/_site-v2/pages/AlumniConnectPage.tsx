import AlumniConnectSection from '@/app/_components/AlumniConnectSection';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { alumniConnectContent } from '../content';

export default function AlumniConnectPage({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}) {
  return (
    <MarketingShell>
      <PageHero
        title={alumniConnectContent.title}
        description={alumniConnectContent.description}
      />
      <section className='fgs-section pb-16'>
        <AlumniConnectSection turnstileSiteKey={turnstileSiteKey} />
      </section>
    </MarketingShell>
  );
}
