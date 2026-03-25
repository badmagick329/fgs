import ContactSection from '@/app/_components/ContactSection';
import JoinSection from '@/app/_components/JoinSection';
import WhyFgsSection from '@/app/_components/WhyFgsSection';
import PreviewShell from '@/app/_marketing/PreviewShell';
import { previewOneNavItems } from '@/app/_marketing/content';
import AboutOverviewSection from '@/app/_marketing/sections/AboutOverviewSection';
import CeoMessageSection from '@/app/_marketing/sections/CeoMessageSection';
import GallerySection from '@/app/_marketing/sections/GallerySection';
import MarketingHero from '@/app/_marketing/sections/MarketingHero';

export default function PreviewPage() {
  return (
    <PreviewShell navItems={previewOneNavItems}>
      <MarketingHero />
      <CeoMessageSection />
      <AboutOverviewSection />
      <WhyFgsSection />
      <GallerySection />
      <JoinSection />
      <ContactSection />
    </PreviewShell>
  );
}
