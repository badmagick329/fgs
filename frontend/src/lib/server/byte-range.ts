export type ByteRange = { start: number; end: number };

/**
 * Reads a single-range `Range` header against an object of `sizeBytes`
 * (RFC 9110 §14.1.2). Returns the inclusive range to serve, `null` to serve
 * the whole object, or `'unsatisfiable'` for a 416. Browsers seek video with
 * one range at a time, so a multi-range or malformed header is answered with
 * the whole object, which the RFC allows.
 */
export function parseByteRange(
  header: string | null,
  sizeBytes: number
): ByteRange | 'unsatisfiable' | null {
  const match = header?.trim().match(/^bytes=(\d*)-(\d*)$/i);
  if (!match) return null;
  const [, first, last] = match;
  if (!first && !last) return null;

  if (!first) {
    const suffix = Number(last);
    if (suffix === 0) return 'unsatisfiable';
    return { start: Math.max(0, sizeBytes - suffix), end: sizeBytes - 1 };
  }

  const start = Number(first);
  const end = last ? Number(last) : sizeBytes - 1;
  if (last && end < start) return null;
  if (start >= sizeBytes) return 'unsatisfiable';
  return { start, end: Math.min(end, sizeBytes - 1) };
}
