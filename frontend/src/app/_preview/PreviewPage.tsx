import PreviewShell from '@/app/_marketing/PreviewShell';
import { marketingNavItems } from '@/app/_marketing/content';
import AboutSection from '@/app/_marketing/sections/AboutSection';
import AcknowledgementSection from '@/app/_marketing/sections/AcknowledgementSection';
import CeoMessageSection from '@/app/_marketing/sections/CeoMessageSection';
import ContactSection from '@/app/_marketing/sections/ContactSection';
import GallerySection from '@/app/_marketing/sections/GallerySection';
import HighlightsStrip from '@/app/_marketing/sections/HighlightsStrip';
import JoinSection from '@/app/_marketing/sections/JoinSection';
import MarketingHero from '@/app/_marketing/sections/MarketingHero';
import WhyFgsSection from '@/app/_marketing/sections/WhyFgsSection';

export default function PreviewPage() {
  return (
    <PreviewShell navItems={marketingNavItems}>
      <MarketingHero />
      <CeoMessageSection />
      <AboutSection />
      <HighlightsStrip />
      <WhyFgsSection />
      <GallerySection />
      <ContactSection />
      <AcknowledgementSection />
    </PreviewShell>
  );
}
