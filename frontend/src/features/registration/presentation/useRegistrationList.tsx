'use client';

import { getRegistrations } from '@/features/registration/presentation/registration-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { QUERY_KEYS } from '@/lib/consts';

export default function useRegistrationList() {
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: [...QUERY_KEYS.registrations, page],
    queryFn: () => getRegistrations(page),
    // Keeps the current rows on screen while the next page loads, so paging
    // does not flash the loading state.
    placeholderData: keepPreviousData,
  });

  const hasNextPage = q.data?.hasNextPage ?? false;

  return {
    isLoading: q.isLoading,
    isError: q.isError,
    isFetching: q.isFetching,
    error: q.error,
    data: q.data?.registrations ?? [],
    page,
    hasPreviousPage: page > 1,
    hasNextPage,
    goToPreviousPage: () => setPage((current) => Math.max(1, current - 1)),
    goToNextPage: () => {
      if (hasNextPage) setPage((current) => current + 1);
    },
  };
}
