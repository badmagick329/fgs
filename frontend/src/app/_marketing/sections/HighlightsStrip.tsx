'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { achievementsContent } from '../content';

export default function HighlightsStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const statRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      achievementsContent.stats.forEach((stat, index) => {
        const statElement = statRefs.current[index];
        const target = Number.parseInt(stat.value.replace(/\D/g, ''), 10);

        if (!statElement || Number.isNaN(target)) {
          return;
        }

        statElement.textContent = '0';

        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            const counter = { value: 0 };

            gsap.to(counter, {
              value: target,
              duration: 1.5,
              ease: 'power2.out',
              delay: index * 0.1,
              onUpdate: () => {
                statElement.textContent = Math.round(counter.value).toLocaleString(
                  'en-US'
                );
              },
              onComplete: () => {
                statElement.textContent = stat.value;
              },
            });
          },
        });
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className='fgs-section reveal'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <h3 className='fgs-subheading mt-2'>{achievementsContent.title}</h3>
        </div>
        <div className='mt-5 grid gap-3 sm:grid-cols-3'>
          {achievementsContent.stats.map((stat, index) => (
            <div
              key={`${stat.value}-${stat.label}`}
              className='rounded-sm border border-border bg-fgs-surface px-4 py-4'
            >
              <p
                ref={(element) => {
                  statRefs.current[index] = element;
                }}
                className='text-fgs-ink text-2xl font-semibold leading-none sm:text-3xl'
              >
                {stat.value}
              </p>
              <p className='text-fgs-ink mt-2 text-sm font-semibold'>
                {stat.label}
              </p>
              {stat.supporting ? (
                <p className='fgs-copy mt-1 text-xs'>{stat.supporting}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
