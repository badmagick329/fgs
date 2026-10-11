import AlumniStoryForm from '@/app/_components/AlumniStoryForm';
import MarketingShell from '../MarketingShell';
import PageHero from '../PageHero';
import { alumniConnectContent } from '../content';

export default function AlumniConnectPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow={alumniConnectContent.eyebrow}
        title={alumniConnectContent.title}
        description={alumniConnectContent.description}
      />
      <section className='fgs-section pb-16'>
        <div className='mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8'>
          <div className='mt-8 border-l-4 border-brand-blue bg-brand-blue/5 px-5 py-5 sm:px-8 sm:py-7'>
            <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
              {alumniConnectContent.tipsTitle}
            </h2>
            <ul className='fgs-copy mt-4 list-disc space-y-2 pl-5'>
              {alumniConnectContent.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className='rounded-[0.3rem] border border-border bg-card px-5 py-5 shadow-sm sm:px-6 sm:py-6'>
            <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
              {alumniConnectContent.formTitle}
            </h2>
            <div className='mt-5'>
              <AlumniStoryForm />
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
