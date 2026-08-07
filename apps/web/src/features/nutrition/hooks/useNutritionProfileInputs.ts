import { useCallback } from 'react'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchNutritionProfileInputs } from '../services/nutrition.service.js'

export const useNutritionProfileInputs = () => {
  const load = useCallback(() => fetchNutritionProfileInputs(), [])
  return useAsyncResource(
    load,
    'We could not load your calculator profile inputs. Please try again.',
  )
}
