'use client';

import { alumniConnectContent } from '@/app/_site-v2/content';
import { FgsBookSpinner, FgsLogo } from '@/components/brand/FgsLogo';
import {
  type CreateAlumniStoryDraft,
  type CreateAlumniStoryDraftInput,
  MEDIA_LIMITS,
  type MediaKind,
  STORY_TEXT_MAX_LENGTH,
  createAlumniStoryDraftSchema,
} from '@/features/alumni-stories/domain/alumni-story';
import {
  type MediaItem,
  useAlumniStorySubmission,
} from '@/features/alumni-stories/presentation/useAlumniStorySubmission';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ImageIcon, Video, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';

const inputClassName =
  'mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-fgs-ink outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-70';

const defaultValues: Partial<CreateAlumniStoryDraftInput> = {
  fullName: '',
  graduationYear: undefined,
  profession: '',
  contact: '',
  storyText: '',
};

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className='text-fgs-ink text-sm font-medium'>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className='mt-1.5 text-xs text-muted-foreground'>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          role='alert'
          className='mt-1.5 text-xs text-error'
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function statusText(status: MediaItem['status']) {
  switch (status.state) {
    case 'queued':
      return 'Ready to send';
    case 'uploading':
      return `Uploading ${Math.floor(status.progress * 100)}%`;
    case 'interrupted':
      return `Paused at ${Math.floor(status.progress * 100)}%, waiting for the connection`;
    case 'refused':
      return status.message;
    case 'done':
      return 'Uploaded';
  }
}

function MediaItemRow({
  item,
  onRemove,
}: {
  item: MediaItem;
  onRemove: () => void;
}) {
  const { status } = item;
  const progress =
    status.state === 'uploading' || status.state === 'interrupted'
      ? status.progress
      : status.state === 'done'
        ? 1
        : 0;
  const Icon = item.kind === 'video' ? Video : ImageIcon;

  return (
    <li className='rounded-lg border border-border bg-card px-3 py-2.5'>
      <div className='flex items-center gap-3'>
        <Icon aria-hidden='true' className='size-5 shrink-0 text-brand-blue' />
        <div className='min-w-0 flex-1'>
          <p className='text-fgs-ink truncate text-sm font-medium'>
            {item.file.name}
          </p>
          <p
            className={cn(
              'text-xs',
              status.state === 'refused'
                ? 'text-error'
                : 'text-muted-foreground'
            )}
          >
            {formatSize(item.file.size)} · {statusText(status)}
          </p>
        </div>
        {status.state === 'done' ? (
          <CheckCircle2
            aria-label='Uploaded'
            className='size-5 shrink-0 text-brand-blue'
          />
        ) : (
          <button
            type='button'
            onClick={onRemove}
            aria-label={`Remove ${item.file.name}`}
            className='rounded-md p-1.5 text-muted-foreground hover:text-fgs-ink focus-visible:ring-2 focus-visible:ring-ring/50 outline-none'
          >
            <X aria-hidden='true' className='size-4' />
          </button>
        )}
      </div>
      {status.state !== 'queued' && status.state !== 'refused' ? (
        <div
          role='progressbar'
          aria-label={`${item.file.name} upload`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(progress * 100)}
          className='mt-2 h-1.5 overflow-hidden rounded-full bg-brand-blue/10'
        >
          <div
            className='h-full rounded-full bg-brand-blue transition-[width]'
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      ) : null}
    </li>
  );
}

export default function AlumniStoryForm() {
  const submission = useAlumniStorySubmission();
  const { phase, items, busy, notice } = submission;
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateAlumniStoryDraftInput, unknown, CreateAlumniStoryDraft>({
    resolver: zodResolver(createAlumniStoryDraftSchema),
    defaultValues,
  });

  async function onSubmit(values: CreateAlumniStoryDraft) {
    const fieldErrors = await submission.send(values);
    fieldErrors?.forEach((error) => {
      if (!error.field) return;
      setError(error.field as keyof CreateAlumniStoryDraftInput, {
        type: 'server',
        message: error.message,
      });
    });
  }

  function pickFiles(kind: MediaKind, input: HTMLInputElement) {
    submission.addFiles(kind, Array.from(input.files ?? []));
    // Lets the same file be picked again after it was removed.
    input.value = '';
  }

  // The success panel is much shorter than the form it replaces.
  useEffect(() => {
    if (phase !== 'submitted') return;
    successRef.current?.focus({ preventScroll: true });
    successRef.current?.scrollIntoView({ block: 'center' });
  }, [phase]);

  if (phase === 'submitted') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role='status'
        className='flex flex-col items-center py-6 text-center outline-none'
      >
        <FgsLogo
          animation='celebrate'
          decorative
          className='h-auto w-36 sm:w-40'
        />
        <h3 className='text-fgs-ink mt-5 text-xl font-semibold'>
          {alumniConnectContent.successTitle}
        </h3>
        <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
          {alumniConnectContent.successMessage}
        </p>
        <button
          type='button'
          className='fgs-btn-secondary mt-5'
          onClick={() => {
            submission.reset();
            reset(defaultValues);
          }}
        >
          Share another story
        </button>
      </div>
    );
  }

  const count = (kind: MediaKind) =>
    items.filter(
      (item) => item.kind === kind && item.status.state !== 'refused'
    ).length;
  const canAddMedia = phase === 'editing' || phase === 'sending';
  const waiting = items.some((item) => item.status.state === 'interrupted');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6' noValidate>
      <fieldset disabled={phase !== 'editing'} className='space-y-4'>
        <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]'>
          <Field
            id='fullName'
            label='Full Name'
            error={errors.fullName?.message}
          >
            <input
              id='fullName'
              type='text'
              autoComplete='name'
              {...register('fullName')}
              aria-invalid={!!errors.fullName}
              aria-describedby={describedBy(
                'fullName',
                errors.fullName?.message
              )}
              className={inputClassName}
            />
          </Field>
          <Field
            id='graduationYear'
            label='Graduation Year'
            error={errors.graduationYear?.message}
          >
            <input
              id='graduationYear'
              type='text'
              inputMode='numeric'
              maxLength={4}
              placeholder='e.g. 2010'
              {...register('graduationYear', {
                setValueAs: (value: string) =>
                  value.trim() === '' ? undefined : Number(value),
              })}
              aria-invalid={!!errors.graduationYear}
              aria-describedby={describedBy(
                'graduationYear',
                errors.graduationYear?.message
              )}
              className={inputClassName}
            />
          </Field>
        </div>

        <Field
          id='profession'
          label='Current Profession or Field'
          error={errors.profession?.message}
        >
          <input
            id='profession'
            type='text'
            placeholder='e.g. Commercial pilot, software engineer, doctor'
            {...register('profession')}
            aria-invalid={!!errors.profession}
            aria-describedby={describedBy(
              'profession',
              errors.profession?.message
            )}
            className={inputClassName}
          />
        </Field>

        <Field
          id='contact'
          label='Phone or Email'
          hint={alumniConnectContent.contactHint}
          error={errors.contact?.message}
        >
          <input
            id='contact'
            type='text'
            {...register('contact')}
            aria-invalid={!!errors.contact}
            aria-describedby={describedBy(
              'contact',
              errors.contact?.message,
              alumniConnectContent.contactHint
            )}
            className={inputClassName}
          />
        </Field>

        <Field
          id='storyText'
          label='Your Message to Students'
          hint={alumniConnectContent.storyTextHint}
          error={errors.storyText?.message}
        >
          <textarea
            id='storyText'
            rows={5}
            maxLength={STORY_TEXT_MAX_LENGTH}
            {...register('storyText')}
            aria-invalid={!!errors.storyText}
            aria-describedby={describedBy(
              'storyText',
              errors.storyText?.message,
              alumniConnectContent.storyTextHint
            )}
            className={inputClassName}
          />
        </Field>
      </fieldset>

      <div>
        <h3 className='text-fgs-ink text-sm font-medium'>
          {alumniConnectContent.mediaTitle}
        </h3>
        <p className='mt-1 text-xs text-muted-foreground'>
          {alumniConnectContent.mediaHint}
        </p>
        <div className='mt-3 flex flex-wrap gap-2'>
          <button
            type='button'
            className='fgs-btn-secondary'
            disabled={
              !canAddMedia || count('video') >= MEDIA_LIMITS.video.maxCount
            }
            onClick={() => videoInputRef.current?.click()}
          >
            <Video aria-hidden='true' className='mr-2 size-4' />
            Add video
          </button>
          <button
            type='button'
            className='fgs-btn-secondary'
            disabled={
              !canAddMedia || count('photo') >= MEDIA_LIMITS.photo.maxCount
            }
            onClick={() => photoInputRef.current?.click()}
          >
            <ImageIcon aria-hidden='true' className='mr-2 size-4' />
            Add photos
          </button>
        </div>
        {/* The accept lists only steer the phone's picker; the server checks
            each file's actual bytes. */}
        <input
          ref={videoInputRef}
          type='file'
          accept='video/*'
          className='hidden'
          onChange={(event) => pickFiles('video', event.currentTarget)}
        />
        <input
          ref={photoInputRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={(event) => pickFiles('photo', event.currentTarget)}
        />
        {items.length ? (
          <ul className='mt-3 space-y-2'>
            {items.map((item) => (
              <MediaItemRow
                key={item.id}
                item={item}
                onRemove={() => submission.removeItem(item.id)}
              />
            ))}
          </ul>
        ) : null}
      </div>

      <div className='space-y-3'>
        <p className='text-xs text-muted-foreground'>
          {alumniConnectContent.uploadNote}
        </p>

        {notice ? (
          <p
            role={notice.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'text-sm',
              notice.tone === 'error' ? 'text-error' : 'text-fgs-ink'
            )}
          >
            {notice.message}
          </p>
        ) : null}

        <div className='flex flex-wrap items-center gap-3'>
          {phase === 'expired' ? (
            <button
              type='button'
              className='fgs-btn-primary w-full justify-center sm:w-auto'
              onClick={submission.startOver}
            >
              Start again
            </button>
          ) : (
            <button
              type='submit'
              disabled={busy}
              className='fgs-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto'
            >
              {busy ? (
                <>
                  <FgsBookSpinner className='mr-2 h-[1.15em] w-auto' />
                  Sending...
                </>
              ) : phase === 'sending' ? (
                waiting ? (
                  'Resume upload'
                ) : (
                  'Continue sending'
                )
              ) : (
                'Send my story'
              )}
            </button>
          )}
        </div>

        <p className='text-xs text-muted-foreground'>
          {alumniConnectContent.reviewNote}
        </p>
      </div>
    </form>
  );
}
