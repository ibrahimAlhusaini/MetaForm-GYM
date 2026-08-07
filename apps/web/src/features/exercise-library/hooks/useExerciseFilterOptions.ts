import { useCallback } from 'react'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchExerciseFilterOptions } from '../services/exercise-library.service.js'

export const useExerciseFilterOptions = () => {
  const load = useCallback(() => fetchExerciseFilterOptions(), [])
  return useAsyncResource(
    load,
    'We could not load exercise filters. Please try again.',
  )
}
