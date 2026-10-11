import {
  AlumniStoryStatus,
  adminAlumniStoryDetailSchema,
  alumniStorySummarySchema,
} from '@/features/alumni-stories/domain/alumni-story';
import { z } from 'zod';
import { requestJson } from '@/lib/client/request-json';
import { API } from '@/lib/consts';

const okSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ ok: z.literal(true), data });

const errorMessage = (status: number, message?: string) =>
  status === 401
    ? 'Authentication required.'
    : (message ?? 'Failed to load alumni stories.');

export async function getAdminAlumniStories(status: AlumniStoryStatus) {
  const url = `${API.admin.alumniStories}?status=${encodeURIComponent(status)}`;
  const result = await requestJson(url, {
    schema: okSchema(z.array(alumniStorySummarySchema)),
    errorMessage,
  });
  return result.data;
}

export async function getAdminAlumniStory(id: number) {
  const result = await requestJson(API.admin.alumniStoryById(id), {
    schema: okSchema(adminAlumniStoryDetailSchema),
    errorMessage,
  });
  return result.data;
}
