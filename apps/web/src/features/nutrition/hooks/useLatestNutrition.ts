import { useCallback } from 'react'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchLatestNutrition } from '../services/nutrition.service.js'

export const useLatestNutrition = () => {
  const load = useCallback(() => fetchLatestNutrition(), [])
  return useAsyncResource(
    load,
    'We could not load your latest calculation. Please try again.',
  )
}
