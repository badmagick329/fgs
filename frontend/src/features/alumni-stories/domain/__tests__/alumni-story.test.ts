import {
  MEDIA_LIMITS,
  canReview,
  canSubmit,
  createAlumniStoryDraftSchema,
  mediaUploadViolation,
} from '@/features/alumni-stories/domain/alumni-story';
import { describe, expect, it } from 'bun:test';

const validDraft = {
  fullName: 'Ayesha Khan',
  graduationYear: 2010,
  profession: 'Commercial pilot',
  contact: '03001234567',
};

describe('createAlumniStoryDraftSchema', () => {
  it('accepts a phone number, an international number or an email as contact', () => {
    for (const contact of ['03001234567', '+44 7700 900123', 'a@b.com']) {
      expect(
        createAlumniStoryDraftSchema.safeParse({ ...validDraft, contact })
          .success
      ).toBe(true);
    }
  });

  it('rejects contact that is neither phone nor email', () => {
    const result = createAlumniStoryDraftSchema.safeParse({
      ...validDraft,
      contact: 'call me',
    });
    expect(result.success).toBe(false);
  });

  it('rejects graduation years before the school opened or in the future', () => {
    for (const graduationYear of [1977, new Date().getFullYear() + 1]) {
      expect(
        createAlumniStoryDraftSchema.safeParse({
          ...validDraft,
          graduationYear,
        }).success
      ).toBe(false);
    }
  });

  it('stores blank story text as null', () => {
    const parsed = createAlumniStoryDraftSchema.parse({
      ...validDraft,
      storyText: '   ',
    });
    expect(parsed.storyText).toBeNull();
  });
});

describe('mediaUploadViolation', () => {
  const video = { kind: 'video' as const, mimeType: 'video/mp4', sizeBytes: 1 };

  it('allows media within type, size and count limits', () => {
    expect(mediaUploadViolation(video, 0)).toBeNull();
  });

  it('refuses unsupported types', () => {
    expect(
      mediaUploadViolation({ ...video, mimeType: 'application/pdf' }, 0)
    ).toContain('Unsupported');
  });

  it('refuses files over the size cap', () => {
    expect(
      mediaUploadViolation(
        { ...video, sizeBytes: MEDIA_LIMITS.video.maxBytes + 1 },
        0
      )
    ).toContain('at most 300 MB');
  });

  it('refuses a fourth photo and a second video', () => {
    expect(
      mediaUploadViolation(
        { kind: 'photo', mimeType: 'image/jpeg', sizeBytes: 1 },
        3
      )
    ).toContain('at most 3 photos');
    expect(mediaUploadViolation(video, 1)).toContain('at most 1 video');
  });
});

describe('canSubmit', () => {
  it('needs text or media', () => {
    expect(canSubmit({ status: 'draft', story_text: null }, 0)).toBe(false);
    expect(canSubmit({ status: 'draft', story_text: 'Hi' }, 0)).toBe(true);
    expect(canSubmit({ status: 'draft', story_text: null }, 1)).toBe(true);
  });

  it('refuses stories already submitted', () => {
    expect(canSubmit({ status: 'pending', story_text: 'Hi' }, 1)).toBe(false);
  });
});

describe('canReview', () => {
  it('allows any submitted story and never a draft', () => {
    expect(canReview('draft')).toBe(false);
    expect(canReview('pending')).toBe(true);
    expect(canReview('approved')).toBe(true);
    expect(canReview('rejected')).toBe(true);
  });
});
