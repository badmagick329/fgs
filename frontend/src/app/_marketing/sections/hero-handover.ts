// Hands the home hero over from the logo intro to the first photo. The photo is never held back
// for the animation:
// - photo ready while the intro is still in its grace period (cached): show it at once, the
//   logo never appears;
// - photo ready mid-intro: compress whatever is left of the intro, then fade the photo in;
// - photo ready after the intro: fade it in straight away (the logo idles until then).
// State goes on the section as data-hero-shown='instant' | 'fade'; CSS does the rest (globals.css,
// "Hero handover"), so it all works before hydration.

export const HERO_SHOWN_EVENT = 'fgs-hero-shown';

export type HeroHandoverOptions = {
  /** Whatever remains of the intro is compressed into this long once the photo is ready. */
  fastForwardMs: number;
  shownEvent: string;
};

export const HERO_HANDOVER_OPTIONS: HeroHandoverOptions = {
  fastForwardMs: 400,
  shownEvent: HERO_SHOWN_EVENT,
};

/**
 * Must stay self-contained (no imports or module-level references, Array.from over spreads): it
 * is also inlined into the server HTML via toString(), so it runs while the page is still parsing.
 * On 2G the scripts hydrate long after the photo arrives, and the handover cannot wait for them.
 * Idempotent per section, so the inline run and the post-hydration effect can both call it.
 */
export function runHeroHandover(section: HTMLElement, options: HeroHandoverOptions) {
  if (section.dataset.heroHandover) return;
  section.dataset.heroHandover = 'running';

  // Three sizes of the first photo are rendered; only the one the breakpoint shows counts.
  const photo = Array.from(
    section.querySelectorAll<HTMLImageElement>('.fgs-hero-first-photo img')
  ).find((img) => img.offsetWidth > 0);
  const stage = section.querySelector<HTMLElement>('.fgs-hero-intro__stage');
  const logo = section.querySelector<SVGSVGElement>('.fgs-hero-intro .fgs-logo');

  const show = (mode: 'instant' | 'fade') => {
    section.dataset.heroShown = mode;
    section.dispatchEvent(new Event(options.shownEvent));
  };

  const onPhotoReady = () => {
    // The stage stays transparent for a short grace period (CSS), long enough for a cached photo
    // to arrive. Still transparent means the logo was never seen, so skip it entirely.
    if (!stage || !logo || getComputedStyle(stage).opacity === '0') return show('instant');

    // Infinite idle loops never finish; only the finite intro counts.
    const intro = logo.getAnimations({ subtree: true }).filter((animation) =>
      Number.isFinite(Number(animation.effect?.getComputedTiming().endTime))
    );
    const remainingMs = Math.max(
      0,
      ...intro.map(
        (animation) =>
          Number(animation.effect?.getComputedTiming().endTime) - Number(animation.currentTime ?? 0)
      )
    );
    // playbackRate also scales unstarted delays, so later parts still play in order.
    const rate = remainingMs / options.fastForwardMs;
    if (rate > 1) intro.forEach((animation) => animation.updatePlaybackRate(rate));
    Promise.all(intro.map((animation) => animation.finished))
      .catch(() => undefined)
      .then(() => show('fade'));
  };

  if (!photo) return show('instant');
  if (photo.complete && photo.naturalWidth > 0) onPhotoReady();
  else photo.addEventListener('load', onPhotoReady, { once: true });
}
