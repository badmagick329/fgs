'use client';

import {
  AdminAlumniStoryDetail,
  AdminAlumniStoryMedia,
} from '@/features/alumni-stories/domain/alumni-story';
import { useAdminAlumniStory } from '@/features/alumni-stories/presentation/useAdminAlumniStories';
import { formatPakistanAppointment } from '@/features/registration/domain/registration-rules';
import { Download } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { API, ROUTES } from '@/lib/consts';
import { AdminActions } from '../../_components/AdminActions';
import { AdminBackdrop } from '../../_components/AdminBackdrop';

export default function AlumniStoryPage() {
  const { id } = useParams<{ id: string }>();
  const query = useAdminAlumniStory(Number(id));

  return (
    <main className='bg-background text-foreground relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8'>
      <AdminBackdrop />
      <div className='relative z-10 mx-auto flex max-w-5xl flex-col'>
        <AdminActions
          className='mb-6'
          navigationHref={ROUTES.admin.alumniStories}
          navigationLabel='All alumni stories'
        />
        {query.isLoading ? (
          <p className='fgs-copy'>Loading story...</p>
        ) : query.isError ? (
          <p className='text-error'>{query.error.message}</p>
        ) : query.data ? (
          <StoryDetail detail={query.data} />
        ) : (
          <p className='text-error'>Story not found.</p>
        )}
      </div>
    </main>
  );
}

function StoryDetail({
  detail: { story, media },
}: {
  detail: AdminAlumniStoryDetail;
}) {
  const videos = media.filter((m) => m.kind === 'video');
  const photos = media.filter((m) => m.kind === 'photo');
  const facts: [string, string][] = [
    ['Graduation year', String(story.graduation_year)],
    ['Profession', story.profession],
    ['Contact (never shown publicly)', story.contact],
    ['Status', story.status],
    [
      'Submitted',
      story.submitted_at ? formatPakistanAppointment(story.submitted_at) : '—',
    ],
  ];

  return (
    <article className='flex flex-col gap-6'>
      <header>
        <p className='text-sm text-muted-foreground'>Story #{story.id}</p>
        <h2 className='fgs-heading'>{story.full_name}</h2>
      </header>

      <dl className='grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2'>
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className='text-xs text-muted-foreground'>{label}</dt>
            <dd className='font-medium break-words'>{value}</dd>
          </div>
        ))}
      </dl>

      <section className='rounded-2xl border border-border bg-card p-4'>
        <h3 className='fgs-subheading'>Message</h3>
        <p className='fgs-copy mt-2 whitespace-pre-line'>
          {story.story_text ?? 'No written message.'}
        </p>
      </section>

      <section className='rounded-2xl border border-border bg-card p-4'>
        <h3 className='fgs-subheading'>Video</h3>
        {videos.length ? (
          videos.map((video) => (
            <figure key={video.id} className='mt-3'>
              {/* preload=metadata fetches only the header; seeking uses Range requests. */}
              <video
                controls
                preload='metadata'
                src={API.admin.alumniStoryMedia(video.id)}
                className='max-h-[70vh] w-full rounded-xl bg-black'
              />
              <MediaCaption media={video} />
            </figure>
          ))
        ) : (
          <p className='fgs-copy mt-2'>No video.</p>
        )}
      </section>

      <section className='rounded-2xl border border-border bg-card p-4'>
        <h3 className='fgs-subheading'>Photos</h3>
        {photos.length ? (
          <div className='mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {photos.map((photo) => (
              <PhotoTile key={photo.id} photo={photo} />
            ))}
          </div>
        ) : (
          <p className='fgs-copy mt-2'>No photos.</p>
        )}
      </section>
    </article>
  );
}

/** Chrome and Firefox cannot render HEIC, so iPhone photos fall back to a download. */
function PhotoTile({ photo }: { photo: AdminAlumniStoryMedia }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure>
      {failed ? (
        <div className='fgs-copy flex aspect-square items-center justify-center rounded-xl bg-fgs-surface p-4 text-center text-sm'>
          This browser cannot preview {photo.mime_type}. Download it below.
        </div>
      ) : (
        // A plain img: next/image's optimiser fetches without the admin cookie.
        <img
          src={API.admin.alumniStoryMedia(photo.id)}
          alt={photo.original_filename ?? `Photo ${photo.id}`}
          onError={() => setFailed(true)}
          className='aspect-square w-full rounded-xl object-cover'
        />
      )}
      <MediaCaption media={photo} />
    </figure>
  );
}

function MediaCaption({ media }: { media: AdminAlumniStoryMedia }) {
  const sizeMb = (media.size_bytes / 1024 / 1024).toFixed(1);
  return (
    <figcaption className='mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground'>
      <span className='break-all'>
        {media.original_filename ?? `File ${media.id}`} · {media.mime_type} ·{' '}
        {sizeMb} MB
      </span>
      <a
        href={`${API.admin.alumniStoryMedia(media.id)}?download=1`}
        className='fgs-link inline-flex items-center gap-1'
      >
        <Download className='size-4' aria-hidden />
        Download original
      </a>
    </figcaption>
  );
}
