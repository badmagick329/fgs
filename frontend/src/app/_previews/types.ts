export const PREVIEW_IDS = ['1', '2', '3'] as const;

export type PreviewId = (typeof PREVIEW_IDS)[number];
