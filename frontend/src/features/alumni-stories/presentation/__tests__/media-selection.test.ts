import { selectMedia } from '@/features/alumni-stories/presentation/media-selection';
import { describe, expect, it } from 'bun:test';

const MB = 1024 * 1024;

describe('selectMedia', () => {
  it('accepts photos up to the story limit and names the surplus', () => {
    const files = ['a.jpg', 'b.jpg', 'c.jpg'].map((name) => ({
      name,
      size: MB,
    }));

    const { accepted, problems } = selectMedia('photo', files, 1);

    expect(accepted.map((f) => f.name)).toEqual(['a.jpg', 'b.jpg']);
    expect(problems).toEqual(['c.jpg: A story can have at most 3 photos']);
  });

  it('refuses a file over its kind’s size cap without counting it', () => {
    const { accepted, problems } = selectMedia(
      'video',
      [
        { name: 'long.mov', size: 301 * MB },
        { name: 'short.mp4', size: 80 * MB },
      ],
      0
    );

    expect(accepted.map((f) => f.name)).toEqual(['short.mp4']);
    expect(problems).toEqual(['long.mov: A video must be at most 300 MB']);
  });
});
