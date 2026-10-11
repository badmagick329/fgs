'use client';

import AlumniStoryForm from '@/app/_components/AlumniStoryForm';
import { alumniConnectContent } from '@/app/_site-v2/content';
import { useAlumniStorySubmission } from '@/features/alumni-stories/presentation/useAlumniStorySubmission';

/**
 * The recording tips and the form share the submission state so the tips can
 * go once the story is sent: by then they no longer apply.
 */
export default function AlumniConnectSection({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string;
}) {
  const submission = useAlumniStorySubmission();

  return (
    <div className='mx-auto max-w-3xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8'>
      {submission.phase !== 'submitted' ? (
        <div className='border-l-4 border-brand-blue bg-brand-blue/5 px-5 py-5 sm:px-8 sm:py-7'>
          <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
            {alumniConnectContent.tipsTitle}
          </h2>
          <ul className='fgs-copy mt-4 list-disc space-y-2 pl-5'>
            {alumniConnectContent.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className='rounded-[0.3rem] border border-border bg-card px-5 py-5 shadow-sm sm:px-6 sm:py-6'>
        <h2 className='text-fgs-ink text-xl font-semibold sm:text-2xl'>
          {alumniConnectContent.formTitle}
        </h2>
        <div className='mt-5'>
          <AlumniStoryForm
            submission={submission}
            turnstileSiteKey={turnstileSiteKey}
          />
        </div>
      </div>
    </div>
  );
}
