'use client';

import {
  CreateAlumniStoryDraft,
  MediaKind,
} from '@/features/alumni-stories/domain/alumni-story';
import {
  MediaUpload,
  createAlumniStoryDraft,
  createMediaUpload,
  submitAlumniStory,
} from '@/features/alumni-stories/presentation/alumni-story-client';
import { selectMedia } from '@/features/alumni-stories/presentation/media-selection';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { ErrorRecord } from '@/lib/result';

export type MediaItemStatus =
  | { state: 'queued' }
  | { state: 'uploading'; progress: number }
  | { state: 'interrupted'; progress: number }
  | { state: 'refused'; status: number; message: string }
  | { state: 'done' };

export type MediaItem = {
  id: string;
  kind: MediaKind;
  file: File;
  status: MediaItemStatus;
};

/**
 * `editing` until the draft exists; `sending` while its media goes up;
 * `expired` when the upload token stopped working; `submitted` once the
 * school has it.
 */
export type SubmissionPhase = 'editing' | 'sending' | 'expired' | 'submitted';

export type SubmissionNotice = {
  tone: 'error' | 'info';
  message: string;
} | null;

/** How often an interrupted upload tries again while the page stays open. */
const RESUME_INTERVAL_MS = 15_000;

/**
 * Drives one alumni story from details to submission. The details become a
 * draft first; its media then uploads one file at a time, so a slow phone
 * connection isn't split across files and each file finishes sooner. The
 * story is submitted only once every file is in. An upload cut off by a lost
 * connection resumes when the browser is back online, or on the next timer
 * tick while the page stays open.
 */
export function useAlumniStorySubmission() {
  const [phase, setPhase] = useState<SubmissionPhase>('editing');
  const [items, setItemsState] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<SubmissionNotice>(null);

  // The upload loop runs across renders, so it reads and writes these refs
  // rather than captured state.
  const itemsRef = useRef<MediaItem[]>([]);
  const uploadsRef = useRef(new Map<string, MediaUpload>());
  const progressRef = useRef(new Map<string, number>());
  const tokenRef = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const nextIdRef = useRef(0);

  const setItems = useCallback(
    (update: (items: MediaItem[]) => MediaItem[]) => {
      itemsRef.current = update(itemsRef.current);
      setItemsState(itemsRef.current);
    },
    []
  );

  const setStatus = useCallback(
    (id: string, status: MediaItemStatus) =>
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item))
      ),
    [setItems]
  );

  const uploadItem = useCallback(
    async (item: MediaItem, uploadToken: string) => {
      let upload = uploadsRef.current.get(item.id);
      if (!upload) {
        upload = createMediaUpload(item.file, {
          uploadToken,
          kind: item.kind,
          filename: item.file.name,
          onProgress: (progress) => {
            progressRef.current.set(item.id, progress);
            setStatus(item.id, { state: 'uploading', progress });
          },
        });
        uploadsRef.current.set(item.id, upload);
      }

      const progress = progressRef.current.get(item.id) ?? 0;
      setStatus(item.id, { state: 'uploading', progress });
      const result = await upload.run();
      switch (result.outcome) {
        case 'done':
          uploadsRef.current.delete(item.id);
          setStatus(item.id, { state: 'done' });
          break;
        case 'interrupted':
          setStatus(item.id, {
            state: 'interrupted',
            progress: progressRef.current.get(item.id) ?? 0,
          });
          break;
        case 'refused':
          uploadsRef.current.delete(item.id);
          setStatus(item.id, {
            state: 'refused',
            status: result.status,
            message: result.message,
          });
          break;
      }
      return result;
    },
    [setStatus]
  );

  /** Uploads whatever is outstanding, then submits once nothing is. */
  const pump = useCallback(async () => {
    const uploadToken = tokenRef.current;
    if (!uploadToken || sendingRef.current) return;
    sendingRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      for (;;) {
        const next = itemsRef.current.find(
          (item) =>
            item.status.state === 'queued' ||
            item.status.state === 'interrupted'
        );
        if (!next) break;

        const result = await uploadItem(next, uploadToken);
        if (result.outcome === 'interrupted') {
          setNotice({
            tone: 'info',
            message:
              'The connection dropped. Your upload will carry on from where it stopped once you are back online.',
          });
          return;
        }
        if (result.outcome === 'refused' && result.status === 403) {
          tokenRef.current = null;
          setPhase('expired');
          setNotice({
            tone: 'error',
            message:
              'This upload link has expired. Press Start again to send your story with a new one.',
          });
          return;
        }
      }

      if (itemsRef.current.some((item) => item.status.state === 'refused')) {
        setNotice({
          tone: 'error',
          message:
            'Some files could not be uploaded. Remove them or add others, then press Continue sending.',
        });
        return;
      }

      const submitted = await submitAlumniStory(uploadToken);
      if (!submitted.ok) {
        setNotice({ tone: 'error', message: submitted.message });
        return;
      }
      tokenRef.current = null;
      setPhase('submitted');
      trackEvent('Alumni Story');
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
  }, [uploadItem]);

  /**
   * Creates the draft on first use, then sends the media. Returns the
   * server's field errors when the details were refused. `captchaToken` is
   * needed only for the first call, which creates the draft.
   */
  const send = useCallback(
    async (
      details: CreateAlumniStoryDraft,
      captchaToken: string | null
    ): Promise<ErrorRecord[] | null> => {
      if (tokenRef.current) {
        await pump();
        return null;
      }
      if (sendingRef.current) return null;
      if (!details.storyText && itemsRef.current.length === 0) {
        setNotice({
          tone: 'error',
          message: 'Add your story as text, a video or photos before sending.',
        });
        return null;
      }
      if (!captchaToken) {
        setNotice({
          tone: 'error',
          message:
            'Please wait for the security check above the button to finish, then send again.',
        });
        return null;
      }

      sendingRef.current = true;
      setBusy(true);
      setNotice(null);
      const draft = await createAlumniStoryDraft(details, captchaToken);
      sendingRef.current = false;
      setBusy(false);
      if (!draft.ok) {
        if (draft.errors?.some((error) => error.field)) return draft.errors;
        setNotice({ tone: 'error', message: draft.message });
        return null;
      }

      tokenRef.current = draft.data.uploadToken;
      setPhase('sending');
      await pump();
      return null;
    },
    [pump]
  );

  const addFiles = useCallback(
    (kind: MediaKind, files: File[]) => {
      const selected = itemsRef.current.filter(
        (item) => item.kind === kind && item.status.state !== 'refused'
      ).length;
      const { accepted, problems } = selectMedia(kind, files, selected);
      setItems((current) => [
        ...current,
        ...accepted.map((file) => ({
          id: `media-${nextIdRef.current++}`,
          kind,
          file,
          status: { state: 'queued' as const },
        })),
      ]);
      setNotice(
        problems.length ? { tone: 'error', message: problems.join(' ') } : null
      );
    },
    [setItems]
  );

  const removeItem = useCallback(
    (id: string) => {
      const upload = uploadsRef.current.get(id);
      uploadsRef.current.delete(id);
      progressRef.current.delete(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setNotice(null);
      void upload?.remove();
    },
    [setItems]
  );

  const forgetUploads = () => {
    // Uploads made under a spent token can't be finished, so only stop them.
    uploadsRef.current.clear();
    progressRef.current.clear();
    tokenRef.current = null;
  };

  /** After the token expired: keeps the details and files for a new draft. */
  const startOver = useCallback(() => {
    forgetUploads();
    setItems((current) =>
      current
        .filter(
          (item) =>
            item.status.state !== 'refused' || item.status.status === 403
        )
        .map((item) => ({ ...item, status: { state: 'queued' } }))
    );
    setNotice(null);
    setPhase('editing');
  }, [setItems]);

  /** After a submission: clears everything for the next story. */
  const reset = useCallback(() => {
    forgetUploads();
    setItems(() => []);
    setNotice(null);
    setPhase('editing');
  }, [setItems]);

  const waiting = items.some((item) => item.status.state === 'interrupted');
  useEffect(() => {
    if (phase !== 'sending' || !waiting) return;
    const resume = () => {
      if (navigator.onLine) void pump();
    };
    window.addEventListener('online', resume);
    const timer = window.setInterval(resume, RESUME_INTERVAL_MS);
    return () => {
      window.removeEventListener('online', resume);
      window.clearInterval(timer);
    };
  }, [phase, waiting, pump]);

  // The token lives only in this page, so leaving mid-send loses the draft.
  useEffect(() => {
    if (phase !== 'sending') return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [phase]);

  return {
    phase,
    items,
    busy,
    notice,
    send,
    addFiles,
    removeItem,
    startOver,
    reset,
  };
}

export type AlumniStorySubmission = ReturnType<typeof useAlumniStorySubmission>;
