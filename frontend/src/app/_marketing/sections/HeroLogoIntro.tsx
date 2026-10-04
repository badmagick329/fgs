'use client';

import { FgsLogo } from '@/components/brand/FgsLogo';
import {
  FAST_FORWARD_MS,
  INTRO_DURATION_MS,
  INTRO_START_DELAY_MS,
  chooseHandover,
  finishAnimationsWithin,
} from '@/lib/client/logo-intro';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

type Phase = 'waiting' | 'playing' | 'leaving' | 'gone';

// How long the leaving emblem stays mounted: its 0.3s hold + 0.5s fade, plus slack.
const LEAVE_MS = 900;

/**
 * Fills the blank hero while the first photo loads: the logo assembles itself, then hands
 * over the moment `photoReady` turns true. It never delays the photo. If the photo lands
 * mid-intro, the rest of the intro is fast-forwarded so the logo finishes as the photo fades
 * in; if the photo was cached, the intro never starts.
 */
export default function HeroLogoIntro({ photoReady }: { photoReady: boolean }) {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [idle, setIdle] = useState(false);
  const [holdBeforeFade, setHoldBeforeFade] = useState(false);
  const logoRef = useRef<SVGSVGElement>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (photoReady || phase !== 'waiting') return;
    const timer = window.setTimeout(() => {
      startedAtRef.current = performance.now();
      setPhase('playing');
    }, INTRO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [photoReady, phase]);

  useEffect(() => {
    if (phase !== 'playing' || photoReady) return;
    const timer = window.setTimeout(() => setIdle(true), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase, photoReady]);

  useEffect(() => {
    if (!photoReady || phase !== 'playing') return;
    const handover = chooseHandover(true, performance.now() - startedAtRef.current);
    if (handover === 'fast-forward' && logoRef.current) {
      finishAnimationsWithin(logoRef.current.getAnimations({ subtree: true }), FAST_FORWARD_MS);
      setHoldBeforeFade(true);
    }
    setPhase('leaving');
  }, [photoReady, phase]);

  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = window.setTimeout(() => setPhase('gone'), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'waiting' || phase === 'gone') return null;

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 grid place-items-center transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
        phase === 'leaving' && 'scale-[1.06] opacity-0',
        // Keep the emblem a beat so its sped-up finish is seen through the incoming photo.
        phase === 'leaving' && holdBeforeFade && 'delay-300'
      )}
    >
      <FgsLogo
        ref={logoRef}
        animation='intro'
        decorative
        className={cn('h-auto w-[min(13.75rem,46vw)]', idle && 'fgs-logo--idle')}
      />
    </div>
  );
}
