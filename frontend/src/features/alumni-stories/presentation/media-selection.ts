import {
  MediaKind,
  mediaUploadStartViolation,
} from '@/features/alumni-stories/domain/alumni-story';

/**
 * Splits newly picked files into those that fit the story and messages for
 * those that don't, so an oversized or surplus file is refused at once
 * rather than after it has crossed a mobile connection. The server checks
 * the same limits again.
 */
export function selectMedia<F extends { name: string; size: number }>(
  kind: MediaKind,
  files: readonly F[],
  alreadySelected: number
): { accepted: F[]; problems: string[] } {
  const accepted: F[] = [];
  const problems: string[] = [];
  for (const file of files) {
    const violation = mediaUploadStartViolation(
      { kind, sizeBytes: file.size },
      alreadySelected + accepted.length
    );
    if (violation) problems.push(`${file.name}: ${violation}`);
    else accepted.push(file);
  }
  return { accepted, problems };
}
