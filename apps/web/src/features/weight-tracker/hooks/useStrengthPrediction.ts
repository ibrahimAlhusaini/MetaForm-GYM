import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchStrengthPrediction } from '../services/weight-tracker.service.js'
import type { SourceType } from '../types/weight-tracker.types.js'
import { useAsyncResource } from './useAsyncResource.js'

export const useStrengthPrediction = (
  sourceType: SourceType,
  sourceId: string,
) => {
  const { t } = useTranslation('strengthPrediction')
  const load = useCallback(
    () => fetchStrengthPrediction(sourceType, sourceId),
    [sourceId, sourceType],
  )
  return useAsyncResource(load, t('states.unavailable'))
}
