import { IDiskSpace } from '@/features/alumni-stories/domain/interfaces';
import { statfs } from 'node:fs/promises';

export class StatfsDiskSpace implements IDiskSpace {
  /** `directory` must exist; any path on the disk being measured will do. */
  constructor(private readonly directory: string) {}

  async freeBytes() {
    const stats = await statfs(this.directory);
    return stats.bavail * stats.bsize;
  }
}
