import ContactSection from '@/app/_components/ContactSection';
import JoinSection from '@/app/_components/JoinSection';
import WhyFgsSection from '@/app/_components/WhyFgsSection';
import PreviewShell from '@/app/_marketing/PreviewShell';
import { previewOneNavItems } from '@/app/_marketing/content';
import CeoMessageSection from '@/app/_marketing/sections/CeoMessageSection';
import FoundersSection from '@/app/_marketing/sections/FoundersSection';
import GallerySection from '@/app/_marketing/sections/GallerySection';
import MarketingHero from '@/app/_marketing/sections/MarketingHero';

export default function PreviewPage() {
  return (
    <PreviewShell navItems={previewOneNavItems}>
      <MarketingHero />
      <CeoMessageSection />
      <FoundersSection />
      <WhyFgsSection />
      <GallerySection />
      <ContactSection />
    </PreviewShell>
  );
}
