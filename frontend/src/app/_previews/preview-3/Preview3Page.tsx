import ContactSection from '@/app/_components/ContactSection';
import JoinSection from '@/app/_components/JoinSection';
import WhyFgsSection from '@/app/_components/WhyFgsSection';
import PreviewShell from '@/app/_marketing/PreviewShell';
import { previewThreeNavItems } from '@/app/_marketing/content';
import AchievementsSection from '@/app/_marketing/sections/AchievementsSection';
import CeoMessageSection from '@/app/_marketing/sections/CeoMessageSection';
import FoundersSection from '@/app/_marketing/sections/FoundersSection';
import GallerySection from '@/app/_marketing/sections/GallerySection';
import MarketingHero from '@/app/_marketing/sections/MarketingHero';

export default function Preview3Page() {
  return (
    <PreviewShell navItems={previewThreeNavItems}>
      <MarketingHero />
      <AchievementsSection variant='band' />
      <CeoMessageSection variant='spotlight' />
      <WhyFgsSection />
      <FoundersSection variant='split' />
      <GallerySection variant='band' />
      <JoinSection />
      <ContactSection />
    </PreviewShell>
  );
}
