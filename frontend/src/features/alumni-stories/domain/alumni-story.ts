import * as z from 'zod';

export const ALUMNI_STORY_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
] as const;
export type AlumniStoryStatus = (typeof ALUMNI_STORY_STATUSES)[number];

export const ALUMNI_STORY_REVIEW_DECISIONS = ['approved', 'rejected'] as const;
export type AlumniStoryReviewDecision =
  (typeof ALUMNI_STORY_REVIEW_DECISIONS)[number];

export const MEDIA_KINDS = ['video', 'photo'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_VARIANTS = ['original', 'edited', 'display'] as const;
export type MediaVariant = (typeof MEDIA_VARIANTS)[number];

/**
 * Which video the public page shows: the alumnus's own, or the school's edit
 * of it. Original until an admin uploads an edit and picks it.
 */
export const PUBLIC_VIDEO_VARIANTS = [
  'original',
  'edited',
] as const satisfies readonly MediaVariant[];
export type PublicVideoVariant = (typeof PUBLIC_VIDEO_VARIANTS)[number];

/** The school was founded in 1978, so no alumnus graduated earlier. */
export const FIRST_GRADUATION_YEAR = 1978;

/**
 * Per-story upload limits. The pamphlet asks for one 30–40 s video and 2–3
 * photos; the byte caps leave room for 4K phone recordings of that length.
 * HEIC/HEVC are accepted because iPhones record them by default.
 */
export const MEDIA_LIMITS: Record<
  MediaKind,
  { maxCount: number; maxBytes: number; mimeTypes: readonly string[] }
> = {
  video: {
    maxCount: 1,
    maxBytes: 300 * 1024 * 1024,
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'],
  },
  photo: {
    maxCount: 3,
    maxBytes: 15 * 1024 * 1024,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ],
  },
};

/** How long an alumnus has to finish uploading before the draft is swept. */
export const DRAFT_LIFETIME_MS = 24 * 60 * 60 * 1000;

/** Carries the draft's upload token on every upload and on submit. */
export const UPLOAD_TOKEN_HEADER = 'X-Upload-Token';

export const STORY_TEXT_MAX_LENGTH = 5000;

const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{5,18}[0-9]$/;
const isEmailOrPhone = (value: string) =>
  z.email().safeParse(value).success || PHONE_PATTERN.test(value);

export const createAlumniStoryDraftSchema = z.object({
  fullName: z
    .string()
    .trim()
    .nonempty({ error: 'Name is required' })
    .max(120, { error: 'Name is too long' }),
  graduationYear: z
    .number({ error: 'Graduation year is required' })
    .int()
    .min(FIRST_GRADUATION_YEAR, {
      error: `Graduation year must be ${FIRST_GRADUATION_YEAR} or later`,
    })
    .refine((year) => year <= new Date().getFullYear(), {
      error: 'Graduation year cannot be in the future',
    }),
  profession: z
    .string()
    .trim()
    .nonempty({ error: 'Profession or field is required' })
    .max(160, { error: 'Profession or field is too long' }),
  contact: z
    .string()
    .trim()
    .nonempty({ error: 'A phone number or email is required' })
    .max(160)
    .refine(isEmailOrPhone, {
      error: 'Enter a valid phone number or email address',
    }),
  storyText: z
    .string()
    .trim()
    .max(STORY_TEXT_MAX_LENGTH, {
      error: `Story must be ${STORY_TEXT_MAX_LENGTH} characters or fewer`,
    })
    .optional()
    .transform((text) => text || null),
});

export type CreateAlumniStoryDraft = z.output<
  typeof createAlumniStoryDraftSchema
>;

export type CreateAlumniStoryDraftInput = z.input<
  typeof createAlumniStoryDraftSchema
>;

export const createdAlumniStoryDraftSchema = z.object({
  storyId: z.number().int().positive(),
  uploadToken: z.string().min(1),
  uploadTokenExpiresAt: z.iso.datetime(),
});

export type CreatedAlumniStoryDraft = z.infer<
  typeof createdAlumniStoryDraftSchema
>;

export const submittedAlumniStorySchema = z.object({
  storyId: z.number().int().positive(),
});

export type SubmittedAlumniStory = z.infer<typeof submittedAlumniStorySchema>;

export const alumniStorySchema = z.object({
  id: z.number().positive(),
  status: z.enum(ALUMNI_STORY_STATUSES),
  full_name: z.string(),
  graduation_year: z.number().int(),
  profession: z.string(),
  contact: z.string(),
  story_text: z.string().nullable(),
  created_at: z.coerce.date(),
  submitted_at: z.coerce.date().nullable(),
  reviewed_at: z.coerce.date().nullable(),
  reviewed_by_admin_user_id: z.number().nullable(),
  display_order: z.number().nullable(),
  public_video_variant: z.enum(PUBLIC_VIDEO_VARIANTS),
});

export type AlumniStory = z.infer<typeof alumniStorySchema>;

export const alumniStoryMediaSchema = z.object({
  id: z.number().positive(),
  story_id: z.number().positive(),
  kind: z.enum(MEDIA_KINDS),
  variant: z.enum(MEDIA_VARIANTS),
  storage_key: z.string(),
  mime_type: z.string(),
  // pg returns BIGINT as a string
  size_bytes: z.coerce.number().positive(),
  original_filename: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type AlumniStoryMedia = z.infer<typeof alumniStoryMediaSchema>;

export const alumniStorySummarySchema = alumniStorySchema.extend({
  video_count: z.coerce.number().nonnegative(),
  photo_count: z.coerce.number().nonnegative(),
});

export type AlumniStorySummary = z.infer<typeof alumniStorySummarySchema>;

export type AlumniStoryWithMedia = {
  story: AlumniStory;
  media: AlumniStoryMedia[];
};

/** Statuses an admin can list; drafts are uploads still in progress. */
export const SUBMITTED_ALUMNI_STORY_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const satisfies readonly AlumniStoryStatus[];

/** Media as the admin API sends it: storage keys stay on the server. */
export const adminAlumniStoryMediaSchema = alumniStoryMediaSchema.omit({
  storage_key: true,
});

export type AdminAlumniStoryMedia = z.infer<typeof adminAlumniStoryMediaSchema>;

export const adminAlumniStoryDetailSchema = z.object({
  story: alumniStorySchema,
  media: z.array(adminAlumniStoryMediaSchema),
});

export type AdminAlumniStoryDetail = z.infer<
  typeof adminAlumniStoryDetailSchema
>;

export const choosePublicVideoSchema = z.object({
  publicVideoVariant: z.enum(PUBLIC_VIDEO_VARIANTS),
});

export type NewAlumniStoryMedia = {
  kind: MediaKind;
  variant: MediaVariant;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string | null;
};

/**
 * Why an upload of `sizeBytes` may not start, or null when it may. Checked
 * when an upload is created, before any bytes arrive; the type is only known
 * once the file's first bytes are in.
 */
export function mediaUploadStartViolation(
  upload: { kind: MediaKind; sizeBytes: number },
  existingOfKind: number
): string | null {
  const limits = MEDIA_LIMITS[upload.kind];
  if (upload.sizeBytes <= 0 || upload.sizeBytes > limits.maxBytes) {
    return `A ${upload.kind} must be at most ${limits.maxBytes / 1024 / 1024} MB`;
  }
  if (existingOfKind >= limits.maxCount) {
    return `A story can have at most ${limits.maxCount} ${upload.kind}${limits.maxCount === 1 ? '' : 's'}`;
  }
  return null;
}

/** Why a finished upload is refused, or null when it fits the story's limits. */
export function mediaUploadViolation(
  upload: { kind: MediaKind; mimeType: string; sizeBytes: number },
  existingOfKind: number
): string | null {
  if (!MEDIA_LIMITS[upload.kind].mimeTypes.includes(upload.mimeType)) {
    return `Unsupported ${upload.kind} type ${upload.mimeType}`;
  }
  return mediaUploadStartViolation(upload, existingOfKind);
}

/**
 * A story can be submitted once it says something: text, or at least one
 * piece of original media.
 */
export function canSubmit(
  story: Pick<AlumniStory, 'status' | 'story_text'>,
  originalMediaCount: number
): boolean {
  return (
    story.status === 'draft' &&
    (Boolean(story.story_text) || originalMediaCount > 0)
  );
}

/**
 * Drafts are invisible to admins until submitted. Once submitted, a story can
 * move freely between approved and rejected so admins can change their mind.
 */
export function canReview(status: AlumniStoryStatus): boolean {
  return status !== 'draft';
}
