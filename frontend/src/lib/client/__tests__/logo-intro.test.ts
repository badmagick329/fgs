import { describe, expect, it, mock } from 'bun:test';
import {
  FAST_FORWARD_MS,
  MIN_FAST_FORWARD_ELAPSED_MS,
  chooseHandover,
  finishAnimationsWithin,
} from '../logo-intro';

function fakeAnimation(currentTime: number, endTime: number) {
  return {
    currentTime,
    effect: { getComputedTiming: () => ({ endTime }) } as unknown as AnimationEffect,
    updatePlaybackRate: mock((_rate: number) => {}),
  };
}

describe('chooseHandover', () => {
  it('skips the intro when the photo beat it (cached)', () => {
    expect(chooseHandover(false, 0)).toBe('skip');
  });

  it('fades rather than racing an intro that has barely started', () => {
    expect(chooseHandover(true, MIN_FAST_FORWARD_ELAPSED_MS - 1)).toBe('fade');
  });

  it('fast-forwards once the intro is under way, including after it finished', () => {
    expect(chooseHandover(true, MIN_FAST_FORWARD_ELAPSED_MS)).toBe('fast-forward');
    expect(chooseHandover(true, 5000)).toBe('fast-forward');
  });
});

describe('finishAnimationsWithin', () => {
  it('speeds every animation so the longest remaining one ends on time', () => {
    const head = fakeAnimation(600, 1450); // 850ms left
    const halo = fakeAnimation(600, 2550); // 1950ms left: sets the pace
    const rate = finishAnimationsWithin([head, halo], FAST_FORWARD_MS);

    expect(rate).toBeCloseTo(1950 / FAST_FORWARD_MS);
    expect(head.updatePlaybackRate).toHaveBeenCalledWith(rate);
    expect(halo.updatePlaybackRate).toHaveBeenCalledWith(rate);
  });

  it('ignores infinite idle loops when measuring what is left', () => {
    const bob = fakeAnimation(500, Infinity);
    const drop = fakeAnimation(1000, 1700); // 700ms left
    expect(finishAnimationsWithin([bob, drop], 350)).toBeCloseTo(2);
  });

  it('never slows down an intro that would already finish in time', () => {
    const almostDone = fakeAnimation(2400, 2550);
    expect(finishAnimationsWithin([almostDone], FAST_FORWARD_MS)).toBe(1);
    expect(almostDone.updatePlaybackRate).not.toHaveBeenCalled();
  });
});
