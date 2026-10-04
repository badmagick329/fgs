'use client';

import { FgsLogo } from '@/components/brand/FgsLogo';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

// How long the emblem stays mounted once the photo is shown: its 0.5s fade, plus slack.
const LEAVE_MS = 700;

/**
 * The hero's placeholder: the logo assembles itself in the space the first photo will take.
 * It is server-rendered and animated purely in CSS, so it appears and plays from first paint,
 * before any JavaScript arrives. On slow connections the scripts can land long after the
 * photo, so nothing here may depend on hydration to start. Once hydrated it reports when the
 * intro has finished; the hero shows the photo only after both the photo and the intro are
 * done. If the photo is still loading by then, the logo keeps breathing and a loading bar
 * fades in under it, so slow-connection visitors know more is coming (also pure CSS).
 */
export default function HeroLogoIntro({
  photoShown,
  onIntroDone,
}: {
  photoShown: boolean;
  onIntroDone: () => void;
}) {
  const logoRef = useRef<SVGSVGElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const logo = logoRef.current;
    if (!logo) return;
    let cancelled = false;
    // The intro may already have finished before hydration; `finished` then resolves at once.
    // Infinite idle loops never finish, so only finite animations count.
    const intro = logo
      .getAnimations({ subtree: true })
      .filter((animation) => Number.isFinite(Number(animation.effect?.getComputedTiming().endTime)));
    Promise.all(intro.map((animation) => animation.finished))
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) onIntroDone();
      });
    return () => {
      cancelled = true;
    };
  }, [onIntroDone]);

  useEffect(() => {
    if (!photoShown) return;
    const timer = window.setTimeout(() => setGone(true), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [photoShown]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 grid place-items-center transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
        photoShown && 'scale-[1.06] opacity-0'
      )}
    >
      <div className='relative'>
        <FgsLogo
          ref={logoRef}
          animation='intro'
          decorative
          className='fgs-logo--idle h-auto w-[min(13.75rem,46vw)]'
        />
        {/* Positioned below the logo so the logo itself stays centred in the hero. */}
        <div
          className={cn(
            'fgs-hero-loading absolute inset-x-0 top-full mt-5 flex flex-col items-center gap-2',
            // Its CSS delay keeps running after a handover; never let it appear over the photo.
            photoShown && 'hidden'
          )}
        >
          <span className='fgs-hero-loading__bar' />
          <span className='text-xs font-medium tracking-wide text-muted-foreground'>
            Loading photos…
          </span>
        </div>
      </div>
    </div>
  );
}
