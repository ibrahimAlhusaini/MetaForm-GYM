import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchSessions } from '../services/weight-tracker.service.js'
import type { SessionQuery } from '../types/weight-tracker.types.js'
import { useAsyncResource } from './useAsyncResource.js'

export const useSessions = (query: SessionQuery) => {
  const { t } = useTranslation('weightTracker')
  const {
    completed,
    dateFrom,
    dateTo,
    limit,
    page,
    search,
    sortBy,
    sortOrder,
  } = query
  const load = useCallback(
    () =>
      fetchSessions({
        ...(completed === undefined ? {} : { completed }),
        ...(dateFrom === undefined ? {} : { dateFrom }),
        ...(dateTo === undefined ? {} : { dateTo }),
        ...(limit === undefined ? {} : { limit }),
        ...(page === undefined ? {} : { page }),
        ...(search === undefined ? {} : { search }),
        ...(sortBy === undefined ? {} : { sortBy }),
        ...(sortOrder === undefined ? {} : { sortOrder }),
      }),
    [completed, dateFrom, dateTo, limit, page, search, sortBy, sortOrder],
  )
  return useAsyncResource(load, t('errors.workouts'))
}
