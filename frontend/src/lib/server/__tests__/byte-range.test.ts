import { describe, expect, it } from 'bun:test';
import { parseByteRange } from '@/lib/server/byte-range';

describe('parseByteRange', () => {
  it('reads closed, open-ended and suffix ranges', () => {
    expect(parseByteRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 });
    expect(parseByteRange('bytes=900-', 1000)).toEqual({
      start: 900,
      end: 999,
    });
    expect(parseByteRange('bytes=-100', 1000)).toEqual({
      start: 900,
      end: 999,
    });
  });

  it('clamps an end past the object to its last byte', () => {
    expect(parseByteRange('bytes=500-5000', 1000)).toEqual({
      start: 500,
      end: 999,
    });
    expect(parseByteRange('bytes=-5000', 1000)).toEqual({ start: 0, end: 999 });
  });

  it('refuses a range that starts past the object', () => {
    expect(parseByteRange('bytes=1000-', 1000)).toBe('unsatisfiable');
    expect(parseByteRange('bytes=-0', 1000)).toBe('unsatisfiable');
  });

  it('serves the whole object for no, malformed or multi-range headers', () => {
    expect(parseByteRange(null, 1000)).toBeNull();
    expect(parseByteRange('bytes=-', 1000)).toBeNull();
    expect(parseByteRange('bytes=9-1', 1000)).toBeNull();
    expect(parseByteRange('bytes=0-1,5-9', 1000)).toBeNull();
    expect(parseByteRange('items=0-1', 1000)).toBeNull();
  });
});
