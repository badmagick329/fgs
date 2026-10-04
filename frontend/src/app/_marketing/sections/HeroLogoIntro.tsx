'use client';

import { FgsLogo } from '@/components/brand/FgsLogo';
import { useEffect, useState } from 'react';

// How long the emblem stays mounted once the photo is shown: its 0.5s fade, plus slack.
const LEAVE_MS = 700;

/**
 * The hero's placeholder: the logo assembles itself in the space the first photo will take.
 * It is server-rendered and animated purely in CSS, so it plays from first paint, before any
 * JavaScript arrives. When and how it gives way to the photo is decided by hero-handover.ts and
 * styled from the section's data-hero-shown (globals.css, "Hero handover"); this component only
 * unmounts it afterwards. If the photo is still loading after the intro, the logo keeps
 * breathing and a loading bar fades in under it, so slow-connection visitors know more is coming.
 */
export default function HeroLogoIntro({ photoShown }: { photoShown: boolean }) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!photoShown) return;
    const timer = window.setTimeout(() => setGone(true), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [photoShown]);

  if (gone) return null;

  return (
    <div aria-hidden className='fgs-hero-intro pointer-events-none absolute inset-0 grid place-items-center'>
      <div className='fgs-hero-intro__stage relative'>
        <FgsLogo animation='intro' decorative className='fgs-logo--idle h-auto w-[min(13.75rem,46vw)]' />
        {/* Positioned below the logo so the logo itself stays centred in the hero. */}
        <div className='fgs-hero-loading absolute inset-x-0 top-full mt-5 flex flex-col items-center gap-2'>
          <span className='fgs-hero-loading__bar' />
          <span className='text-xs font-medium tracking-wide text-muted-foreground'>
            Loading photos…
          </span>
        </div>
      </div>
    </div>
  );
}
