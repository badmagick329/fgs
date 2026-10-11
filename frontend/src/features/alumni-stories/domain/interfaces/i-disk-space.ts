/** Free space on the disk that uploads are written to. */
export interface IDiskSpace {
  /** Bytes the app can still write, excluding space reserved for root. */
  freeBytes(): Promise<number>;
}
