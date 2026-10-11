/** Enough of a file's start to read its signature and ISO-BMFF brands. */
export const MEDIA_SNIFF_BYTES = 64;

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((byte, i) => bytes[i] === byte);

const HEIC_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx']);
// MP4 containers that hold audio or e-books rather than video.
const NON_VIDEO_MP4_BRANDS = new Set(['M4A ', 'M4B ', 'M4P ']);

/**
 * ISO base media files (MP4, MOV, 3GP, HEIC, AVIF) all start with an `ftyp`
 * box; its major and compatible brands say which one it is.
 */
function sniffIsoBaseMedia(head: Uint8Array): string | null {
  const boxSize = new DataView(head.buffer, head.byteOffset).getUint32(0);
  const brandsEnd = Math.min(boxSize, head.length);
  const major = ascii(head, 8, 12);
  const brands = [major];
  for (let offset = 16; offset + 4 <= brandsEnd; offset += 4) {
    brands.push(ascii(head, offset, offset + 4));
  }

  if (major === 'qt  ') return 'video/quicktime';
  if (major.startsWith('3g')) return 'video/3gpp';
  if (HEIC_BRANDS.has(major)) return 'image/heic';
  if (major === 'mif1' || major === 'msf1') {
    if (brands.some((brand) => HEIC_BRANDS.has(brand))) return 'image/heic';
    // AVIF shares the HEIF container but is not an accepted photo type.
    if (brands.includes('avif') || brands.includes('avis')) return null;
    return 'image/heif';
  }
  if (major === 'avif' || major === 'avis') return null;
  if (NON_VIDEO_MP4_BRANDS.has(major)) return null;
  return 'video/mp4';
}

/**
 * The media type a file's first bytes prove, or null when they match no
 * accepted type. Uploads are typed by this, never by the client's claim.
 */
export function sniffMediaType(head: Uint8Array): string | null {
  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  // EBML header; WebM declares its doctype within the first few bytes, which
  // tells it apart from other Matroska files.
  if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) {
    return ascii(head, 0, head.length).includes('webm') ? 'video/webm' : null;
  }
  if (head.length >= 12 && ascii(head, 4, 8) === 'ftyp') {
    return sniffIsoBaseMedia(head);
  }
  return null;
}
