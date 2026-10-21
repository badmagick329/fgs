import { AlumniStoryService } from '@/features/alumni-stories/application/alumni-story-service';
import {
  AlumniStoryUploadService,
  UploadError,
} from '@/features/alumni-stories/application/alumni-story-upload-service';
import { EditedVideoUploadService } from '@/features/alumni-stories/application/edited-video-upload-service';
import { UploadBudget } from '@/features/alumni-stories/application/upload-budget';
import {
  DRAFT_LIFETIME_MS,
  MEDIA_LIMITS,
  UPLOAD_TOKEN_HEADER,
} from '@/features/alumni-stories/domain/alumni-story';
import {
  IDiskSpace,
  IUploadStaging,
  StagedUpload,
} from '@/features/alumni-stories/domain/interfaces';
import { FileStore } from '@tus/file-store';
import { ERRORS, EVENTS, Server, type ServerOptions } from '@tus/server';
import { open } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import 'server-only';
import { API } from '@/lib/consts';
import { IClock } from '@/lib/server/i-clock';
import { INotifier } from '@/lib/server/i-notifier';

const STATUS_BY_ERROR: Record<UploadError, number> = {
  'bad-request': 400,
  'not-found': 404,
  'invalid-token': 403,
  forbidden: 403,
  'not-draft': 403,
  'too-large': 413,
  'invalid-media': 415,
  // Not 409: tus clients treat 409 as an offset conflict and retry.
  'limit-reached': 422,
  // Our client does not retry 507; a full disk outlasts any retry delay.
  'disk-full': 507,
};

const tusError = (result: { error: UploadError; message: string }) => ({
  status_code: STATUS_BY_ERROR[result.error],
  body: `${result.message}\n`,
});

class FileStoreStaging implements IUploadStaging {
  constructor(private readonly store: FileStore) {}

  async list() {
    // The store makes its folder asynchronously, so the first call may beat it.
    const ids = await this.store.configstore.list!().catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      }
    );
    const uploads = await Promise.all(
      ids.map((id) =>
        this.store.getUpload(id).catch((error) => {
          // Finished or removed since the folder was read.
          if (
            error === ERRORS.FILE_NOT_FOUND ||
            error === ERRORS.FILE_NO_LONGER_EXISTS
          ) {
            return null;
          }
          throw error;
        })
      )
    );
    return uploads.flatMap((upload): StagedUpload[] =>
      upload
        ? [
            {
              uploadId: upload.id,
              // Admission refuses deferred lengths, so every staged upload has one.
              sizeBytes: upload.size ?? 0,
              receivedBytes: upload.offset,
            },
          ]
        : []
    );
  }

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
 * Creation-with-upload would finish inside POST, where tus re-reads the
 * upload after onUploadFinish has already removed it.
 */
function refuseCreationWithUpload(req: Request) {
  if (req.headers.get('content-type') === 'application/offset+octet-stream') {
    throw tusError({
      error: 'bad-request',
      message: 'Send file bytes with PATCH, not with the creation request',
    });
  }
}

/**
 * tus protocol errors carry a status; anything else is a server fault whose
 * message should stay in the logs.
 */
const onResponseError: ServerOptions['onResponseError'] = (_req, error) => {
  if ('status_code' in error) return undefined;
  console.error('alumni story upload failed', error);
  return {
    status_code: 500,
    body: 'The upload failed on the server. Please try again.\n',
  };
};

const stagingStore = (directory: string) =>
  new FileStore({
    directory,
    expirationPeriodInMilliseconds: DRAFT_LIFETIME_MS,
  });

/**
 * Builds both tus endpoints for Alumni Connect: alumnus media and admins'
 * edited videos. Each stages in its own folder, since a tus store sweeps its
 * whole folder, but both draw on one disk budget, so the free-space floor
 * holds across them. The folders must sit on the disk `diskSpace` measures.
 */
export function createAlumniStoryUploadEndpoints(options: {
  stories: AlumniStoryService;
  directories: { alumniMedia: string; editedVideos: string };
  diskSpace: IDiskSpace;
  notifier: INotifier;
  clock: IClock;
}) {
  const alumniStore = stagingStore(options.directories.alumniMedia);
  const editedStore = stagingStore(options.directories.editedVideos);
  const alumniStaging = new FileStoreStaging(alumniStore);
  const editedStaging = new FileStoreStaging(editedStore);
  const budget = new UploadBudget(
    [alumniStaging, editedStaging],
    options.diskSpace,
    options.notifier,
    options.clock
  );
  return {
    alumniStoryUploads: createAlumniStoryUploads(
      new AlumniStoryUploadService(
        options.stories,
        alumniStaging,
        budget,
        options.clock
      ),
      alumniStore
    ),
    editedVideoUploads: createEditedVideoUploads(
      new EditedVideoUploadService(options.stories, editedStaging, budget),
      editedStore
    ),
  };
}

/**
 * The tus endpoint for alumni story media. Uploads stage in `store` and move
 * into the media store once complete; the application service decides who
 * may upload what.
 */
function createAlumniStoryUploads(
  uploads: AlumniStoryUploadService,
  store: FileStore
) {
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
      refuseCreationWithUpload(req);
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

    onResponseError,
  });

  server.on(EVENTS.POST_TERMINATE, (_req, _res, uploadId: string) => {
    uploads.release(uploadId);
  });

  return { server, uploads };
}

/**
 * The tus endpoint admins upload edited videos to. It authorizes nothing
 * itself: its route admits only signed-in admins, on every method.
 */
function createEditedVideoUploads(
  uploads: EditedVideoUploadService,
  store: FileStore
) {
  const server = new Server({
    path: API.admin.alumniStoryEditedVideoUploads,
    datastore: store,
    relativeLocation: true,
    maxSize: MEDIA_LIMITS.video.maxBytes,
    allowedOrigins: [],
    disableTerminationForFinishedUploads: true,

    async onUploadCreate(req, upload) {
      refuseCreationWithUpload(req);
      const result = await uploads.begin({
        uploadId: upload.id,
        storyId: upload.metadata?.storyId,
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

    onResponseError,
  });

  server.on(EVENTS.POST_TERMINATE, (_req, _res, uploadId: string) => {
    uploads.release(uploadId);
  });

  return { server, uploads };
}
