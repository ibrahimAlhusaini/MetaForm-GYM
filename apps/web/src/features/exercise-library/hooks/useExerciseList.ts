import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchExercises } from '../services/exercise-library.service.js'
import type { ExerciseListQuery } from '../types/exercise-library.types.js'

export const useExerciseList = (query: ExerciseListQuery) => {
  const { t } = useTranslation('exerciseLibrary')
  const {
    difficultyLevel,
    equipmentType,
    limit,
    movementType,
    muscleSubgroup,
    page,
    primaryMuscle,
    search,
    sortBy,
    sortOrder,
  } = query
  const load = useCallback(
    () =>
      fetchExercises({
        page,
        limit,
        sortBy,
        sortOrder,
        ...(search ? { search } : {}),
        ...(primaryMuscle ? { primaryMuscle } : {}),
        ...(muscleSubgroup ? { muscleSubgroup } : {}),
        ...(equipmentType ? { equipmentType } : {}),
        ...(difficultyLevel ? { difficultyLevel } : {}),
        ...(movementType ? { movementType } : {}),
      }),
    [
      difficultyLevel,
      equipmentType,
      limit,
      movementType,
      muscleSubgroup,
      page,
      primaryMuscle,
      search,
      sortBy,
      sortOrder,
    ],
  )
  return useAsyncResource(load, t('errors.list'))
}
