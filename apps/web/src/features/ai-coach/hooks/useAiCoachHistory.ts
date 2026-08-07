import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchAiCoachSessions } from '../services/ai-coach.service.js'
import type { AiCoachHistoryQuery } from '../types/ai-coach.types.js'

export const useAiCoachHistory = (query: AiCoachHistoryQuery) => {
  const { t } = useTranslation('aiCoach')
  const { dateFrom, dateTo, limit, page, sortOrder, status, type } = query
  const load = useCallback(
    () =>
      fetchAiCoachSessions({
        limit,
        page,
        sortOrder,
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      }),
    [dateFrom, dateTo, limit, page, sortOrder, status, type],
  )
  return useAsyncResource(load, t('errors.history'))
}
