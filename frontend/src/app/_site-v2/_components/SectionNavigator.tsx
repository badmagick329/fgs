'use client';

import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type SectionNavigatorItem = {
  id: string;
  label: string;
};

export function SectionNavigator({
  sections,
}: {
  sections: SectionNavigatorItem[];
}) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileNavigatorRef = useRef<HTMLDivElement>(null);
  const activeSection = sections.find(
    (section) => section.id === activeSectionId
  );

  useEffect(() => {
    const sectionElements = sections
      .map((section) => document.getElementById(section.id))
      .filter((section): section is HTMLElement => section !== null);

    if (sectionElements.length === 0) {
      return;
    }

    const updateActiveSection = () => {
      const isAtPageEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;

      if (isAtPageEnd) {
        setActiveSectionId(sectionElements[sectionElements.length - 1].id);
        return;
      }

      const viewportAnchor = window.innerHeight * 0.35;
      const activeSection = sectionElements
        .filter(
          (section) => section.getBoundingClientRect().top <= viewportAnchor
        )
        .at(-1);

      setActiveSectionId(activeSection?.id ?? sectionElements[0].id);
    };

    let animationFrameId: number | undefined;
    const handleScroll = () => {
      if (animationFrameId !== undefined) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = undefined;
        updateActiveSection();
      });
    };

    updateActiveSection();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);

      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [sections]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!mobileNavigatorRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsidePointerDown);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointerDown);
    };
  }, [isMobileMenuOpen]);

  if (sections.length < 2 || !activeSection) {
    return null;
  }

  return (
    <nav aria-label='Page sections'>
      <div className='fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block'>
        <div className='relative flex flex-col py-1 before:absolute before:inset-y-5 before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:bg-brand-blue/55'>
          {sections.map((section) => {
            const isActive = section.id === activeSectionId;

            return (
              <div
                key={section.id}
                className='relative flex h-10 items-center justify-center'
              >
                <a
                  href={`#${section.id}`}
                  aria-label={`Go to ${section.label}`}
                  aria-current={isActive ? 'location' : undefined}
                  className='relative z-10 flex h-10 w-8 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-blue'
                >
                  <span
                    className={`grid place-items-center transition-transform hover:scale-110 ${
                      isActive
                        ? 'h-7 w-7'
                        : 'h-4 w-4 rounded-full border-[3px] border-brand-blue bg-fgs-surface'
                    }`}
                  >
                    {isActive ? (
                      <Image
                        src='/fgs-logo.png'
                        alt=''
                        width={28}
                        height={28}
                        className='h-7 w-7 object-contain'
                      />
                    ) : null}
                  </span>
                  <span
                    className={`absolute left-12 w-36 transition-colors ${
                      isActive
                        ? 'rounded-sm border border-border/80 bg-card/95 px-3 py-1.5 text-sm font-semibold text-fgs-ink shadow-sm backdrop-blur-sm'
                        : 'py-1 text-xs font-medium text-muted-foreground/70 hover:text-fgs-ink'
                    }`}
                  >
                    {section.label}
                  </span>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={mobileNavigatorRef}
        className='fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 xl:hidden'
      >
        <div className='relative'>
          {isMobileMenuOpen ? (
            <div
              id='mobile-section-navigation'
              className='absolute bottom-full mb-2 w-64 rounded-sm border border-border bg-card p-2 shadow-xl backdrop-blur-sm'
            >
              <p className='px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                On this page
              </p>
              <div className='space-y-1'>
                {sections.map((section) => {
                  const isActive = section.id === activeSectionId;

                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      aria-current={isActive ? 'location' : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/20 text-fgs-ink'
                          : 'text-muted-foreground hover:bg-fgs-surface hover:text-fgs-ink'
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isActive ? 'bg-primary' : 'bg-brand-blue'
                        }`}
                      />
                      {section.label}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

          <button
            type='button'
            aria-expanded={isMobileMenuOpen}
            aria-controls='mobile-section-navigation'
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            className='flex items-center gap-3 rounded-full border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue'
          >
            <Image
              src='/fgs-logo.png'
              alt=''
              width={24}
              height={24}
              className='h-6 w-6 rounded-full object-cover'
            />
            <span className='max-w-36 truncate text-sm font-semibold text-fgs-ink'>
              {activeSection.label}
            </span>
            <span className='flex items-center gap-1.5' aria-hidden='true'>
              {sections.map((section) => {
                const isActive = section.id === activeSectionId;

                return (
                  <span
                    key={section.id}
                    className={`rounded-full transition-colors ${
                      isActive
                        ? 'h-2.5 w-5 bg-primary'
                        : 'h-2.5 w-2.5 bg-brand-blue'
                    }`}
                  />
                );
              })}
            </span>
            <ChevronDown
              aria-hidden='true'
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isMobileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </nav>
  );
}
