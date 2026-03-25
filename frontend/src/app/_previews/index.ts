import type { ComponentType } from 'react';
import Preview1Page from './preview-1/Preview1Page';
import Preview2Page from './preview-2/Preview2Page';
import Preview3Page from './preview-3/Preview3Page';
import type { PreviewId } from './types';

const previewPages: Record<PreviewId, ComponentType> = {
  '1': Preview1Page,
  '2': Preview2Page,
  '3': Preview3Page,
};

export function getPreviewPage(previewId: PreviewId) {
  return previewPages[previewId];
}

export type { PreviewId } from './types';
