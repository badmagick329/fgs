import ContactSection from '@/app/_components/ContactSection';
import WhyFgsSection from '@/app/_components/WhyFgsSection';
import PreviewShell from '@/app/_marketing/PreviewShell';
import { previewTwoNavItems } from '@/app/_marketing/content';
import AboutIntroSection from '@/app/_marketing/sections/AboutIntroSection';
import AchievementsSection from '@/app/_marketing/sections/AchievementsSection';
import CeoMessageSection from '@/app/_marketing/sections/CeoMessageSection';
import FoundersSection from '@/app/_marketing/sections/FoundersSection';
import GallerySection from '@/app/_marketing/sections/GallerySection';
import MarketingHero from '@/app/_marketing/sections/MarketingHero';

export default function Preview2Page() {
  return (
    <PreviewShell navItems={previewTwoNavItems}>
      <MarketingHero />
      <AboutIntroSection />
      <FoundersSection variant='editorial' />
      <CeoMessageSection variant='editorial' />
      <AchievementsSection variant='band' />
      <WhyFgsSection />
      <GallerySection variant='editorial' />
      <ContactSection />
    </PreviewShell>
  );
}
