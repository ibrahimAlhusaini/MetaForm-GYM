import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchExerciseFilterOptions } from '../services/exercise-library.service.js'

export const useExerciseFilterOptions = () => {
  const { t } = useTranslation('exerciseLibrary')
  const load = useCallback(() => fetchExerciseFilterOptions(), [])
  return useAsyncResource(load, t('errors.filters'))
}
