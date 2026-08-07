import { useCallback } from 'react'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchNutritionHistory } from '../services/nutrition.service.js'
import type { NutritionHistoryQuery } from '../types/nutrition.types.js'

export const useNutritionHistory = (query: NutritionHistoryQuery) => {
  const { dateFrom, dateTo, limit, page, sortOrder } = query
  const load = useCallback(
    () =>
      fetchNutritionHistory({
        page,
        limit,
        sortOrder,
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      }),
    [dateFrom, dateTo, limit, page, sortOrder],
  )
  return useAsyncResource(
    load,
    'We could not load calculation history. Please try again.',
  )
}
