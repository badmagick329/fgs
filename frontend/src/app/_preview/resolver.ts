type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function shouldShowPreview(searchParams: SearchParams) {
  const previewValue = firstValue(searchParams.preview);

  if (previewValue === '' || previewValue === undefined) {
    if (Object.prototype.hasOwnProperty.call(searchParams, 'preview')) {
      return true;
    }
  }

  return previewValue === '1' || Object.prototype.hasOwnProperty.call(searchParams, 'preview1');
}
