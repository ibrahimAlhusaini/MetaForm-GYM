import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchExercise } from '../services/exercise-library.service.js'

export const useExerciseDetail = (id: string) => {
  const { t } = useTranslation('exerciseLibrary')
  const load = useCallback(() => fetchExercise(id), [id])
  return useAsyncResource(load, t('errors.detail'))
}
