import { sniffMediaType } from '@/features/alumni-stories/domain/media-type';
import { describe, expect, it } from 'bun:test';

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));
const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? ascii(p) : p)));

/** An ISO-BMFF `ftyp` box with the given major and compatible brands. */
const ftyp = (major: string, ...compatible: string[]) =>
  bytes(
    [0, 0, 0, 16 + compatible.length * 4],
    'ftyp',
    major,
    [0, 0, 0, 0],
    ...compatible
  );

describe('sniffMediaType', () => {
  it('recognises the accepted photo formats', () => {
    expect(sniffMediaType(bytes([0xff, 0xd8, 0xff, 0xe1]))).toBe('image/jpeg');
    expect(
      sniffMediaType(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe('image/png');
    expect(sniffMediaType(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '))).toBe(
      'image/webp'
    );
    expect(sniffMediaType(ftyp('heic', 'mif1', 'heic'))).toBe('image/heic');
    expect(sniffMediaType(ftyp('mif1', 'heic'))).toBe('image/heic');
    expect(sniffMediaType(ftyp('mif1'))).toBe('image/heif');
  });

  it('recognises the accepted video formats', () => {
    expect(sniffMediaType(ftyp('isom', 'iso2', 'avc1', 'mp41'))).toBe(
      'video/mp4'
    );
    expect(sniffMediaType(ftyp('qt  ', 'qt  '))).toBe('video/quicktime');
    expect(sniffMediaType(ftyp('3gp4', '3gp4', 'isom'))).toBe('video/3gpp');
    expect(
      sniffMediaType(
        bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x84], 'webm')
      )
    ).toBe('video/webm');
  });

  it('refuses look-alike containers that are not accepted media', () => {
    expect(sniffMediaType(ftyp('avif', 'mif1'))).toBeNull();
    expect(sniffMediaType(ftyp('mif1', 'avif'))).toBeNull();
    expect(sniffMediaType(ftyp('M4A ', 'isom'))).toBeNull();
    expect(
      sniffMediaType(
        bytes([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x82, 0x88], 'matroska')
      )
    ).toBeNull();
  });

  it('refuses other files and truncated input', () => {
    expect(sniffMediaType(bytes('%PDF-1.7'))).toBeNull();
    expect(sniffMediaType(bytes('<svg xmlns='))).toBeNull();
    expect(sniffMediaType(bytes([0xff, 0xd8]))).toBeNull();
    expect(sniffMediaType(bytes())).toBeNull();
  });
});
