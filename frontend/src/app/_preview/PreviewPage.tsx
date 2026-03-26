import ContactSection from '@/app/_components/ContactSection';
import JoinSection from '@/app/_components/JoinSection';
import WhyFgsSection from '@/app/_components/WhyFgsSection';
import PreviewShell from '@/app/_marketing/PreviewShell';
import { previewOneNavItems } from '@/app/_marketing/content';
import AboutSection from '@/app/_marketing/sections/AboutSection';
import CeoMessageSection from '@/app/_marketing/sections/CeoMessageSection';
import GallerySection from '@/app/_marketing/sections/GallerySection';
import HighlightsStrip from '@/app/_marketing/sections/HighlightsStrip';
import MarketingHero from '@/app/_marketing/sections/MarketingHero';

export default function PreviewPage() {
  return (
    <PreviewShell navItems={previewOneNavItems}>
      <MarketingHero />
      <CeoMessageSection />
      <AboutSection />
      <HighlightsStrip />
      <WhyFgsSection />
      <GallerySection />
      <ContactSection />
    </PreviewShell>
  );
}
