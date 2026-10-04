import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { runHeroHandover } from '../hero-handover';

const OPTIONS = { fastForwardMs: 400, shownEvent: 'shown' };

function fakeAnimation(endTime: number, currentTime: number) {
  let finish!: () => void;
  const finished = new Promise<void>((resolve) => (finish = resolve));
  return {
    currentTime,
    effect: { getComputedTiming: () => ({ endTime }) },
    finished,
    finish,
    updatePlaybackRate: mock((_rate: number) => {}),
  };
}

function fakeHero({
  stageOpacity,
  photoComplete,
  animations,
}: {
  stageOpacity: string;
  photoComplete: boolean;
  animations: ReturnType<typeof fakeAnimation>[];
}) {
  const photo = Object.assign(new EventTarget(), {
    offsetWidth: 100,
    complete: photoComplete,
    naturalWidth: photoComplete ? 100 : 0,
  });
  const hiddenSize = { offsetWidth: 0 };
  const stage = { opacity: stageOpacity };
  const logo = { getAnimations: () => animations };
  const section = Object.assign(new EventTarget(), {
    dataset: {} as DOMStringMap,
    querySelectorAll: () => [hiddenSize, photo],
    querySelector: (selector: string) =>
      selector === '.fgs-hero-intro__stage' ? stage : selector === '.fgs-hero-intro .fgs-logo' ? logo : null,
  });
  const shown = mock(() => {});
  section.addEventListener('shown', shown);
  return { section: section as unknown as HTMLElement, photo, stage, shown };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('runHeroHandover', () => {
  const realGetComputedStyle = globalThis.getComputedStyle;
  beforeEach(() => {
    globalThis.getComputedStyle = ((element: { opacity: string }) => ({ opacity: element.opacity })) as never;
  });
  afterEach(() => {
    globalThis.getComputedStyle = realGetComputedStyle;
  });

  it('shows a cached photo instantly without touching the intro', () => {
    const intro = fakeAnimation(1900, 50);
    const hero = fakeHero({ stageOpacity: '0', photoComplete: true, animations: [intro] });

    runHeroHandover(hero.section, OPTIONS);

    expect(hero.section.dataset.heroShown).toBe('instant');
    expect(hero.shown).toHaveBeenCalledTimes(1);
    expect(intro.updatePlaybackRate).not.toHaveBeenCalled();
  });

  it('fast-forwards the rest of the intro when the photo arrives mid-intro, then fades', async () => {
    const book = fakeAnimation(550, 550);
    const halo = fakeAnimation(2550, 750);
    const hero = fakeHero({ stageOpacity: '1', photoComplete: false, animations: [book, halo] });

    runHeroHandover(hero.section, OPTIONS);
    hero.photo.dispatchEvent(new Event('load'));

    // 1800ms of halo left, squeezed into 400ms.
    expect(halo.updatePlaybackRate).toHaveBeenCalledWith(4.5);
    expect(book.updatePlaybackRate).toHaveBeenCalledWith(4.5);
    await flush();
    expect(hero.section.dataset.heroShown).toBeUndefined();

    book.finish();
    halo.finish();
    await flush();
    expect(hero.section.dataset.heroShown).toBe('fade');
    expect(hero.shown).toHaveBeenCalledTimes(1);
  });

  it('fades straight in at normal speed when the intro is (nearly) over', async () => {
    const halo = fakeAnimation(2550, 2400);
    halo.finish();
    const hero = fakeHero({ stageOpacity: '1', photoComplete: true, animations: [halo] });

    runHeroHandover(hero.section, OPTIONS);
    await flush();

    expect(halo.updatePlaybackRate).not.toHaveBeenCalled();
    expect(hero.section.dataset.heroShown).toBe('fade');
  });

  it('runs once per section, so the inline script and the hydrated effect do not both act', () => {
    const hero = fakeHero({ stageOpacity: '1', photoComplete: false, animations: [] });
    const addListener = mock(hero.photo.addEventListener.bind(hero.photo));
    hero.photo.addEventListener = addListener;

    runHeroHandover(hero.section, OPTIONS);
    runHeroHandover(hero.section, OPTIONS);

    expect(addListener).toHaveBeenCalledTimes(1);
  });
});
