'use client';

import { AlumniStoryStatus } from '@/features/alumni-stories/domain/alumni-story';
import {
  getAdminAlumniStories,
  getAdminAlumniStory,
} from '@/features/alumni-stories/presentation/admin-alumni-story-client';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/consts';

export function useAdminAlumniStoryList(status: AlumniStoryStatus) {
  return useQuery({
    queryKey: [...QUERY_KEYS.alumniStories, 'list', status],
    queryFn: () => getAdminAlumniStories(status),
  });
}

export function useAdminAlumniStory(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.alumniStories, 'detail', id],
    queryFn: () => getAdminAlumniStory(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}
