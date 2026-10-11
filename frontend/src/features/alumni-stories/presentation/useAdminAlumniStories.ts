'use client';

import {
  AlumniStoryReviewDecision,
  AlumniStoryStatus,
  PublicVideoVariant,
} from '@/features/alumni-stories/domain/alumni-story';
import {
  chooseAdminPublicVideo,
  getAdminAlumniStories,
  getAdminAlumniStory,
  reviewAdminAlumniStory,
} from '@/features/alumni-stories/presentation/admin-alumni-story-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/consts';

export function useAdminAlumniStoryList(status: AlumniStoryStatus) {
  return useQuery({
    queryKey: [...QUERY_KEYS.alumniStories, 'list', status],
    queryFn: () => getAdminAlumniStories(status),
  });
}

const detailKey = (id: number) => [...QUERY_KEYS.alumniStories, 'detail', id];

export function useAdminAlumniStory(id: number) {
  return useQuery({
    queryKey: detailKey(id),
    queryFn: () => getAdminAlumniStory(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

/** Refetches a story after its media or public video changed. */
export function useRefreshAdminAlumniStory(id: number) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: detailKey(id) });
}

export function useChoosePublicVideo(id: number) {
  const refresh = useRefreshAdminAlumniStory(id);
  return useMutation({
    mutationFn: (variant: PublicVideoVariant) =>
      chooseAdminPublicVideo(id, variant),
    onSuccess: refresh,
  });
}

export function useReviewAlumniStory(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (decision: AlumniStoryReviewDecision) =>
      reviewAdminAlumniStory(id, decision),
    // The story moves between status lists, so refetch those too.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alumniStories }),
  });
}
