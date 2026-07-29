import { SectionNavigator } from './SectionNavigator';

type SectionPageLayoutItem = {
  id: string;
  label: string;
};

export function SectionPageLayout({
  sections,
  children,
}: {
  sections: SectionPageLayoutItem[];
  children: React.ReactNode;
}) {
  return (
    <div className='xl:grid xl:grid-cols-[17rem_minmax(0,1fr)]'>
      <aside>
        <div className='xl:sticky xl:top-24 xl:flex xl:items-start xl:pl-8 xl:pt-8'>
          <SectionNavigator sections={sections} />
        </div>
      </aside>
      <div className='min-w-0'>{children}</div>
    </div>
  );
}
