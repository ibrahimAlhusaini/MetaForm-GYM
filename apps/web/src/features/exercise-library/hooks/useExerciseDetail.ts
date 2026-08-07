import { useCallback } from 'react'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchExercise } from '../services/exercise-library.service.js'

export const useExerciseDetail = (id: string) => {
  const load = useCallback(() => fetchExercise(id), [id])
  return useAsyncResource(
    load,
    'This exercise could not be found or is no longer available.',
  )
}
