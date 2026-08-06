import { useCallback } from 'react'
import { fetchSourceHistory } from '../services/weight-tracker.service.js'
import type { SourceType } from '../types/weight-tracker.types.js'
import { useAsyncResource } from './useAsyncResource.js'

export const useSourceHistory = (
  sourceType: SourceType,
  sourceId: string,
  page: number,
) => {
  const load = useCallback(
    () => fetchSourceHistory(sourceType, sourceId, page),
    [page, sourceId, sourceType],
  )
  return useAsyncResource(
    load,
    'We could not load this strength history. Please try again.',
  )
}
