import { AlumniStoryService } from '@/features/alumni-stories/application/alumni-story-service';
import {
  AlumniStoryUploadService,
  UploadError,
} from '@/features/alumni-stories/application/alumni-story-upload-service';
import {
  DRAFT_LIFETIME_MS,
  MEDIA_LIMITS,
} from '@/features/alumni-stories/domain/alumni-story';
import { IUploadStaging } from '@/features/alumni-stories/domain/interfaces';
import { FileStore } from '@tus/file-store';
import { ERRORS, EVENTS, Server } from '@tus/server';
import { open } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import 'server-only';
import { API } from '@/lib/consts';
import { IClock } from '@/lib/server/i-clock';

/** Carries the draft's upload token on every tus request. */
export const UPLOAD_TOKEN_HEADER = 'X-Upload-Token';

const STATUS_BY_ERROR: Record<UploadError, number> = {
  'bad-request': 400,
  'invalid-token': 403,
  forbidden: 403,
  'not-draft': 403,
  'too-large': 413,
  'invalid-media': 415,
  // Not 409: tus clients treat 409 as an offset conflict and retry.
  'limit-reached': 422,
};

const tusError = (result: { error: UploadError; message: string }) => ({
  status_code: STATUS_BY_ERROR[result.error],
  body: `${result.message}\n`,
});

class FileStoreStaging implements IUploadStaging {
  constructor(private readonly store: FileStore) {}

  async readHead(uploadId: string, length: number) {
    const file = await open(path.join(this.store.directory, uploadId), 'r');
    try {
      const buffer = new Uint8Array(length);
      const { bytesRead } = await file.read(buffer, 0, length, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await file.close();
    }
  }

  open(uploadId: string) {
    return Readable.toWeb(
      this.store.read(uploadId)
    ) as unknown as ReadableStream<Uint8Array>;
  }

  async remove(uploadId: string) {
    try {
      await this.store.remove(uploadId);
    } catch (error) {
      if (error !== ERRORS.FILE_NOT_FOUND) throw error;
      // The bytes are gone; drop the upload's info file too.
      await this.store.configstore.delete(uploadId);
    }
  }

  removeExpired() {
    return this.store.deleteExpired();
  }
}

/**
 * Builds the tus endpoint for alumni story media. Uploads stage under
 * `directory` and move into the media store once complete; the
 * application service decides who may upload what.
 */
export function createAlumniStoryUploads(options: {
  stories: AlumniStoryService;
  directory: string;
  clock: IClock;
}) {
  const store = new FileStore({
    directory: options.directory,
    expirationPeriodInMilliseconds: DRAFT_LIFETIME_MS,
  });
  const uploads = new AlumniStoryUploadService(
    options.stories,
    new FileStoreStaging(store),
    options.clock
  );

  const server = new Server({
    path: API.alumniStoryUploads,
    datastore: store,
    relativeLocation: true,
    maxSize: Math.max(...Object.values(MEDIA_LIMITS).map((l) => l.maxBytes)),
    // Same-origin only: the submission page is the only client.
    allowedOrigins: [],
    disableTerminationForFinishedUploads: true,

    async onIncomingRequest(req, uploadId) {
      // New uploads are authorized in onUploadCreate, with their limits.
      if (req.method === 'POST') return;
      const upload = await store.getUpload(uploadId);
      const result = await uploads.authorize(
        req.headers.get(UPLOAD_TOKEN_HEADER),
        Number(upload.metadata?.storyId)
      );
      if (!result.ok) throw tusError(result);
    },

    async onUploadCreate(req, upload) {
      // Creation-with-upload would finish inside POST, where tus re-reads
      // the upload after onUploadFinish has already removed it.
      if (
        req.headers.get('content-type') === 'application/offset+octet-stream'
      ) {
        throw tusError({
          error: 'bad-request',
          message: 'Send file bytes with PATCH, not with the creation request',
        });
      }
      const result = await uploads.begin(req.headers.get(UPLOAD_TOKEN_HEADER), {
        uploadId: upload.id,
        kind: upload.metadata?.kind,
        sizeBytes: upload.size,
        filename: upload.metadata?.filename,
      });
      if (!result.ok) throw tusError(result);
      return { metadata: result.data };
    },

    async onUploadFinish(_req, upload) {
      const result = await uploads.finish({
        uploadId: upload.id,
        sizeBytes: upload.size,
        metadata: upload.metadata,
      });
      if (!result.ok) throw tusError(result);
      return {};
    },

    onResponseError(_req, error) {
      // tus protocol errors carry a status; anything else is a server fault
      // whose message should stay in the logs.
      if ('status_code' in error) return undefined;
      console.error('alumni story upload failed', error);
      return {
        status_code: 500,
        body: 'The upload failed on the server. Please try again.\n',
      };
    },
  });

  server.on(EVENTS.POST_TERMINATE, (_req, _res, uploadId: string) => {
    uploads.release(uploadId);
  });

  return { server, uploads };
}
