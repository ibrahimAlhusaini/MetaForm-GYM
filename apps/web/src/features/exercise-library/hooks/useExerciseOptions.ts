import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { EXERCISE_OPTION_LIMIT } from '../constants/exercise-library.constants.js'
import { fetchExerciseOptions } from '../services/exercise-library.service.js'
import { optionalSearch } from '../utils/exercise-query.js'

export const useExerciseOptions = (search: string, enabled = true) => {
  const { t } = useTranslation('exerciseLibrary')
  const load = useCallback(() => {
    if (!enabled) return Promise.resolve([])
    const searchValue = optionalSearch(search)
    return fetchExerciseOptions({
      limit: EXERCISE_OPTION_LIMIT,
      ...(searchValue ? { search: searchValue } : {}),
    })
  }, [enabled, search])
  return useAsyncResource(load, t('errors.options'))
}
