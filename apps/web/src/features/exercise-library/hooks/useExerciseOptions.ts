import { useCallback } from 'react'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { EXERCISE_OPTION_LIMIT } from '../constants/exercise-library.constants.js'
import { fetchExerciseOptions } from '../services/exercise-library.service.js'
import { optionalSearch } from '../utils/exercise-query.js'

export const useExerciseOptions = (search: string, enabled = true) => {
  const load = useCallback(() => {
    if (!enabled) return Promise.resolve([])
    const searchValue = optionalSearch(search)
    return fetchExerciseOptions({
      limit: EXERCISE_OPTION_LIMIT,
      ...(searchValue ? { search: searchValue } : {}),
    })
  }, [enabled, search])
  return useAsyncResource(
    load,
    'We could not load Exercise Library options. Please try again.',
  )
}
