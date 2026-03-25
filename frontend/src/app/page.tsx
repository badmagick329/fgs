import { getPreviewPage } from '@/app/_previews';
import { resolvePreview } from '@/app/_previews/resolver';
import UnderConstruction from '@/app/_components/UnderConstruction';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const previewId = resolvePreview(sp);

  if (previewId) {
    const PreviewPage = getPreviewPage(previewId);
    return <PreviewPage />;
  }

  return <UnderConstruction />;
}
