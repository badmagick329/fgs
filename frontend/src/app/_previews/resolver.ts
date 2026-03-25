import { PREVIEW_IDS, type PreviewId } from './types';

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isPreviewId(value: string): value is PreviewId {
  return PREVIEW_IDS.includes(value as PreviewId);
}

export function resolvePreview(searchParams: SearchParams): PreviewId | null {
  const previewValue = firstValue(searchParams.preview);
  if (previewValue === '' || previewValue === undefined) {
    if (Object.prototype.hasOwnProperty.call(searchParams, 'preview')) {
      return '1';
    }
  }

  if (previewValue && isPreviewId(previewValue)) {
    return previewValue;
  }

  for (const previewId of PREVIEW_IDS) {
    if (Object.prototype.hasOwnProperty.call(searchParams, `preview${previewId}`)) {
      return previewId;
    }
  }

  return null;
}
