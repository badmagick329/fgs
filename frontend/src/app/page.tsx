import PreviewPage from '@/app/_components/PreviewPage';
import UnderConstruction from '@/app/_components/UnderConstruction';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (sp.preview !== undefined) {
    return <PreviewPage />;
  }
  return <UnderConstruction />;
}
