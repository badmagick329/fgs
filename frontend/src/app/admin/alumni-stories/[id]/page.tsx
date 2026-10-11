'use client';

import {
  AdminAlumniStoryDetail,
  AdminAlumniStoryMedia,
  AlumniStory,
  MEDIA_LIMITS,
} from '@/features/alumni-stories/domain/alumni-story';
import { uploadEditedVideo } from '@/features/alumni-stories/presentation/admin-alumni-story-client';
import {
  useAdminAlumniStory,
  useChoosePublicVideo,
  useRefreshAdminAlumniStory,
  useReviewAlumniStory,
} from '@/features/alumni-stories/presentation/useAdminAlumniStories';
import { formatPakistanAppointment } from '@/features/registration/domain/registration-rules';
import { Check, Download, Globe, Upload, X } from 'lucide-react';
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

      <ReviewSection story={story} />

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

      <VideoSection story={story} videos={videos} />

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

const DECISIONS = [
  {
    decision: 'approved',
    label: 'Approve',
    className: 'fgs-btn-primary',
    Icon: Check,
  },
  {
    decision: 'rejected',
    label: 'Reject',
    className: 'fgs-btn-danger',
    Icon: X,
  },
] as const;

/** Approved stories go on the public page; a decision can be changed later. */
function ReviewSection({ story }: { story: AlumniStory }) {
  const review = useReviewAlumniStory(story.id);

  return (
    <section className='rounded-2xl border border-border bg-card p-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-xs text-muted-foreground'>Status</p>
          <p className='font-medium capitalize'>{story.status}</p>
          {story.reviewed_at ? (
            <p className='text-sm text-muted-foreground'>
              Reviewed {formatPakistanAppointment(story.reviewed_at)}
            </p>
          ) : null}
        </div>
        {story.status !== 'draft' ? (
          <div className='flex flex-wrap gap-2'>
            {DECISIONS.filter(({ decision }) => decision !== story.status).map(
              ({ decision, label, className, Icon }) => (
                <button
                  key={decision}
                  type='button'
                  className={`${className} inline-flex items-center gap-2`}
                  disabled={review.isPending}
                  onClick={() => review.mutate(decision)}
                >
                  <Icon className='size-4' aria-hidden />
                  {label}
                </button>
              )
            )}
          </div>
        ) : null}
      </div>
      {review.isError ? (
        <p className='text-error mt-2'>{review.error.message}</p>
      ) : null}
    </section>
  );
}

/**
 * The alumnus's video and the school's edit side by side. The site shows the
 * original until an admin uploads an edit and picks it.
 */
function VideoSection({
  story,
  videos,
}: {
  story: AlumniStory;
  videos: AdminAlumniStoryMedia[];
}) {
  const original = videos.find((video) => video.variant === 'original');
  const edited = videos.find((video) => video.variant === 'edited');
  const choose = useChoosePublicVideo(story.id);

  const versions = [
    {
      label: 'Original from the alumnus',
      variant: 'original',
      video: original,
    },
    { label: 'Edited by the school', variant: 'edited', video: edited },
  ] as const;

  return (
    <section className='rounded-2xl border border-border bg-card p-4'>
      <h3 className='fgs-subheading'>Video</h3>
      {!original ? (
        <p className='fgs-copy mt-2'>The alumnus sent no video.</p>
      ) : null}
      {versions.map(({ label, variant, video }) =>
        video ? (
          <figure key={video.id} className='mt-4'>
            <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
              <p className='font-medium'>{label}</p>
              {story.public_video_variant === variant ? (
                <span className='inline-flex items-center gap-1 rounded-full bg-fgs-surface px-3 py-1 text-sm font-medium'>
                  <Globe className='size-4' aria-hidden />
                  Shown on the site
                </span>
              ) : (
                <button
                  type='button'
                  className='fgs-btn-secondary'
                  disabled={choose.isPending}
                  onClick={() => choose.mutate(variant)}
                >
                  Show this one on the site
                </button>
              )}
            </div>
            {/* preload=metadata fetches only the header; seeking uses Range requests. */}
            <video
              controls
              preload='metadata'
              src={API.admin.alumniStoryMedia(video.id)}
              className='max-h-[70vh] w-full rounded-xl bg-black'
            />
            <MediaCaption media={video} />
          </figure>
        ) : null
      )}
      {choose.isError ? (
        <p className='text-error mt-2'>{choose.error.message}</p>
      ) : null}
      {story.status !== 'draft' ? (
        <EditedVideoUpload storyId={story.id} replacing={Boolean(edited)} />
      ) : null}
    </section>
  );
}

type UploadState =
  | { state: 'idle' }
  | { state: 'uploading'; progress: number }
  | { state: 'failed'; message: string };

function EditedVideoUpload({
  storyId,
  replacing,
}: {
  storyId: number;
  replacing: boolean;
}) {
  const [upload, setUpload] = useState<UploadState>({ state: 'idle' });
  const refresh = useRefreshAdminAlumniStory(storyId);

  const start = async (file: File) => {
    setUpload({ state: 'uploading', progress: 0 });
    const result = await uploadEditedVideo(file, {
      storyId,
      filename: file.name,
      onProgress: (progress) => setUpload({ state: 'uploading', progress }),
    });
    if (result.outcome === 'failed') {
      setUpload({ state: 'failed', message: result.message });
      return;
    }
    setUpload({ state: 'idle' });
    await refresh();
  };

  return (
    <div className='mt-4 border-t border-border pt-4'>
      {upload.state === 'uploading' ? (
        <div>
          <p className='text-sm'>
            {/* The server copies the file into storage after the last byte. */}
            {upload.progress < 1
              ? `Uploading edited video… ${Math.round(upload.progress * 100)}%`
              : 'Saving edited video…'}
          </p>
          <progress
            className='mt-2 w-full'
            max={1}
            value={upload.progress}
            aria-label='Edited video upload progress'
          />
        </div>
      ) : (
        <label className='fgs-btn-secondary inline-flex cursor-pointer items-center gap-2'>
          <Upload className='size-4' aria-hidden />
          {replacing ? 'Replace edited video' : 'Upload edited video'}
          <input
            type='file'
            accept={MEDIA_LIMITS.video.mimeTypes.join(',')}
            className='sr-only'
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void start(file);
            }}
          />
        </label>
      )}
      {upload.state === 'failed' ? (
        <p className='text-error mt-2'>{upload.message}</p>
      ) : (
        <p className='mt-2 text-sm text-muted-foreground'>
          The original is kept. Uploading doesn&apos;t change what the site
          shows until you pick the edit.
        </p>
      )}
    </div>
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
        {media.variant === 'edited' ? 'Download edit' : 'Download original'}
      </a>
    </figcaption>
  );
}
