'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlumniStorySummary,
  SUBMITTED_ALUMNI_STORY_STATUSES,
} from '@/features/alumni-stories/domain/alumni-story';
import { useAdminAlumniStoryList } from '@/features/alumni-stories/presentation/useAdminAlumniStories';
import { formatPakistanAppointment } from '@/features/registration/domain/registration-rules';
import { ImageIcon, Video } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@/lib/consts';
import { AdminActions } from '../_components/AdminActions';
import { AdminBackdrop } from '../_components/AdminBackdrop';
import { AdminLogoWatermark } from '../_components/AdminLogoWatermark';

type SubmittedStatus = (typeof SUBMITTED_ALUMNI_STORY_STATUSES)[number];

const STATUS_LABELS: Record<SubmittedStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function AlumniStoriesPage() {
  const [status, setStatus] = useState<SubmittedStatus>('pending');
  const query = useAdminAlumniStoryList(status);

  return (
    <main className='bg-background text-foreground relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8'>
      <AdminBackdrop />
      <div className='relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='fgs-heading'>Alumni stories</h2>
            <p className='fgs-copy mt-2'>
              Stories sent from the Alumni Connect page, newest first.
            </p>
          </div>
          <AdminActions
            navigationHref={ROUTES.admin.root}
            navigationLabel='Admin tools'
            extraLinks={[
              { href: ROUTES.registrations, label: 'Registrations' },
            ]}
          />
        </div>

        <div role='tablist' className='mt-6 flex flex-wrap gap-2'>
          {SUBMITTED_ALUMNI_STORY_STATUSES.map((option) => (
            <button
              key={option}
              type='button'
              role='tab'
              aria-selected={status === option}
              onClick={() => setStatus(option)}
              className={
                status === option ? 'fgs-btn-primary' : 'fgs-btn-secondary'
              }
            >
              {STATUS_LABELS[option]}
            </button>
          ))}
        </div>

        <div className='mt-4 rounded-2xl border border-border bg-card p-2 sm:p-4'>
          {query.isLoading ? (
            <p className='fgs-copy p-4'>Loading stories...</p>
          ) : query.isError ? (
            <p className='text-error p-4'>{query.error.message}</p>
          ) : query.data?.length ? (
            <StoryTable stories={query.data} />
          ) : (
            <p className='fgs-copy p-4'>
              No {STATUS_LABELS[status].toLowerCase()} stories.
            </p>
          )}
        </div>

        <AdminLogoWatermark />
      </div>
    </main>
  );
}

function StoryTable({ stories }: { stories: AlumniStorySummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className='bg-fgs-surface hover:bg-fgs-surface'>
          {['ID', 'Name', 'Year', 'Profession', 'Media', 'Submitted'].map(
            (header) => (
              <TableHead key={header} className='font-semibold'>
                {header}
              </TableHead>
            )
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {stories.map((story) => (
          <TableRow key={story.id}>
            <TableCell>{story.id}</TableCell>
            <TableCell>
              <Link
                href={ROUTES.admin.alumniStory(story.id)}
                className='fgs-link font-medium'
              >
                {story.full_name}
              </Link>
            </TableCell>
            <TableCell>{story.graduation_year}</TableCell>
            <TableCell className='max-w-64 truncate'>
              {story.profession}
            </TableCell>
            <TableCell>
              <span className='inline-flex items-center gap-3'>
                <span className='inline-flex items-center gap-1'>
                  <Video className='size-4' aria-label='Videos' />
                  {story.video_count}
                </span>
                <span className='inline-flex items-center gap-1'>
                  <ImageIcon className='size-4' aria-label='Photos' />
                  {story.photo_count}
                </span>
              </span>
            </TableCell>
            <TableCell>
              {story.submitted_at
                ? formatPakistanAppointment(story.submitted_at)
                : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
