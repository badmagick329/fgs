import { PreviewPage } from '@/app/_preview';
import { shouldShowPreview } from '@/app/_preview/resolver';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (shouldShowPreview(sp)) {
    return <PreviewPage heroVariant={sp.hero} />;
  }

  return <PreviewPage heroVariant='1' />;
}
