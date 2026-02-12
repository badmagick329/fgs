import UnderConstruction from '@/app/_components/UnderConstruction';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  console.log(sp);

  if (sp.preview !== undefined) {
    return <p>Hello</p>;
  }

  return <UnderConstruction />;
}
