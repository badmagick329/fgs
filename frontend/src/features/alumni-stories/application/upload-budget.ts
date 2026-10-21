import type { UploadResult } from '@/features/alumni-stories/application/alumni-story-upload-service';
import { MIN_FREE_DISK_BYTES } from '@/features/alumni-stories/domain/alumni-story';
import {
  IDiskSpace,
  IUploadStaging,
} from '@/features/alumni-stories/domain/interfaces';
import { IClock } from '@/lib/server/i-clock';
import { INotifier } from '@/lib/server/i-notifier';

/** Refusals repeat on every upload while the disk stays low; admins need one ping. */
const DISK_LOW_ALERT_INTERVAL_MS = 60 * 60 * 1000;

/**
 * How long an admitted upload is held in memory. tus writes the upload's
 * files to staging moments after admitting it; the hold only has to outlast
 * that, and an admission that never reaches the disk then stops counting.
 */
const ADMISSION_HOLD_MS = 10 * 60 * 1000;

const gigabytes = (bytes: number) => (bytes / 1024 ** 3).toFixed(1);

/**
 * Admits uploads only while every byte still owed to staged uploads fits
 * above MIN_FREE_DISK_BYTES. One budget covers every staging folder on the
 * media disk, since they all draw on the same free space.
 *
 * Owed bytes come from two places. Uploads already on disk owe their
 * declared size minus what has arrived, read from the staging folders on
 * each admission, so the count survives a restart. Uploads admitted but not
 * yet on disk are held in memory under their full size. The check and the
 * hold happen together after the last await, so uploads admitted side by
 * side each count the others.
 */
export class UploadBudget {
  private readonly admitted = new Map<
    string,
    { sizeBytes: number; admittedAtMs: number }
  >();
  private lastDiskLowAlertMs = -Infinity;

  constructor(
    private readonly stagings: readonly IUploadStaging[],
    private readonly diskSpace: IDiskSpace,
    private readonly notifier: INotifier,
    private readonly clock: IClock
  ) {}

  /** Holds room for `sizeBytes` under `uploadId`, or refuses the upload. */
  async admit(
    uploadId: string,
    sizeBytes: number
  ): Promise<UploadResult<never> | null> {
    const [freeBytes, staged] = await Promise.all([
      this.diskSpace.freeBytes(),
      Promise.all(this.stagings.map((staging) => staging.list())),
    ]);

    // No await from here on: another admission must not run between the
    // check and the hold.
    const nowMs = this.clock.nowMs();
    const onDisk = new Set<string>();
    let owedBytes = 0;
    for (const upload of staged.flat()) {
      onDisk.add(upload.uploadId);
      owedBytes += Math.max(0, upload.sizeBytes - upload.receivedBytes);
    }
    for (const [id, hold] of this.admitted) {
      if (nowMs - hold.admittedAtMs >= ADMISSION_HOLD_MS) {
        this.admitted.delete(id);
      } else if (!onDisk.has(id)) {
        owedBytes += hold.sizeBytes;
      }
    }

    if (freeBytes - owedBytes - sizeBytes < MIN_FREE_DISK_BYTES) {
      this.alertDiskLow(freeBytes, owedBytes, nowMs);
      return {
        ok: false,
        error: 'disk-full',
        message:
          'The server cannot take new uploads right now. Try again later.',
      };
    }
    this.admitted.set(uploadId, { sizeBytes, admittedAtMs: nowMs });
    return null;
  }

  /**
   * Drops the in-memory hold of an upload that failed, finished or was
   * removed. Its staged bytes, while they last, still count from the disk.
   */
  release(uploadId: string) {
    this.admitted.delete(uploadId);
  }

  private alertDiskLow(freeBytes: number, owedBytes: number, nowMs: number) {
    if (nowMs - this.lastDiskLowAlertMs < DISK_LOW_ALERT_INTERVAL_MS) return;
    this.lastDiskLowAlertMs = nowMs;
    void this.notifier
      .sendMessage({
        source: 'alumni-story.disk-low',
        message: `Alumni Connect is refusing new uploads: ${gigabytes(freeBytes)} GB free on the media disk and ${gigabytes(owedBytes)} GB still owed to uploads in progress, against a ${gigabytes(MIN_FREE_DISK_BYTES)} GB floor. Free up space on the server to accept them again.`,
      })
      .catch((error) => {
        console.error('alumni story disk alert failed', error);
      });
  }
}
