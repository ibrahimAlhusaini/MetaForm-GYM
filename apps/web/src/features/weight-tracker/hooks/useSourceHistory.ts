import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchSourceHistory } from '../services/weight-tracker.service.js'
import type { SourceType } from '../types/weight-tracker.types.js'
import { useAsyncResource } from './useAsyncResource.js'

export const useSourceHistory = (
  sourceType: SourceType,
  sourceId: string,
  page: number,
) => {
  const { t } = useTranslation('weightTracker')
  const load = useCallback(
    () => fetchSourceHistory(sourceType, sourceId, page),
    [page, sourceId, sourceType],
  )
  return useAsyncResource(load, t('errors.history'))
}
