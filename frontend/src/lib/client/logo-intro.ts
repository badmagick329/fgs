// Timing rules for handing the hero over from the logo intro to the first photo. The photo is
// never held back for the animation; instead, whatever is left of the intro is sped up so the
// logo always finishes assembling while the photo fades in over it.

/** A photo that arrives sooner than this was cached: never start the intro. */
export const INTRO_START_DELAY_MS = 400;
/** The remainder of the intro is compressed into this long once the photo is ready. */
export const FAST_FORWARD_MS = 350;
/** Below this much intro only the book is out; racing the whole sequence looks frantic. */
export const MIN_FAST_FORWARD_ELAPSED_MS = 300;
/** Length of the intro sequence before it settles into its idle loop. */
export const INTRO_DURATION_MS = 1900;

export type Handover = 'skip' | 'fade' | 'fast-forward';

export function chooseHandover(introStarted: boolean, elapsedMs: number): Handover {
  if (!introStarted) return 'skip';
  return elapsedMs < MIN_FAST_FORWARD_ELAPSED_MS ? 'fade' : 'fast-forward';
}

type FiniteAnimation = Pick<Animation, 'currentTime' | 'effect' | 'updatePlaybackRate'>;

/**
 * Speeds every finite animation up so the longest remaining one ends within `targetMs`.
 * playbackRate also scales unstarted delays, so later parts still play in order. Infinite
 * (idle) loops are ignored. Returns the rate applied, or 1 when nothing needed speeding up.
 */
export function finishAnimationsWithin(animations: readonly FiniteAnimation[], targetMs: number) {
  const remainingMs = Math.max(
    0,
    ...animations.map((animation) => {
      const end = Number(animation.effect?.getComputedTiming().endTime);
      const current = Number(animation.currentTime ?? 0);
      return Number.isFinite(end) ? end - current : 0;
    })
  );
  const rate = remainingMs / targetMs;
  if (rate <= 1) return 1;
  animations.forEach((animation) => animation.updatePlaybackRate(rate));
  return rate;
}
