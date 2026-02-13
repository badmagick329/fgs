import AboutSection from '@/app/_components/AboutSection';
import AlumniSection from '@/app/_components/AlumniSection';
import CampusesSection from '@/app/_components/CampusesSection';
import ContactSection from '@/app/_components/ContactSection';
import JoinSection from '@/app/_components/JoinSection';
import LandingFooter from '@/app/_components/LandingFooter';
import LandingHero from '@/app/_components/LandingHero';
import NavBar, { type SectionId } from '@/app/_components/NavBar';
import WhyFgsSection from '@/app/_components/WhyFgsSection';

const navItems: { id: SectionId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'why-fgs', label: 'Why FGS' },
  { id: 'join', label: 'Join FGS' },
  { id: 'campuses', label: 'Campuses' },
  { id: 'alumni', label: 'Alumni' },
  { id: 'contact', label: 'Contact' },
];
export default function PreviewPage() {
  return (
    <main id='top' className='min-h-screen bg-fgs-surface text-fgs-ink'>
      <NavBar items={navItems} />
      <LandingHero />
      <AboutSection />
      <WhyFgsSection />
      <JoinSection />
      <CampusesSection />
      <AlumniSection />
      <ContactSection />
      <LandingFooter items={navItems} />
    </main>
  );
}
