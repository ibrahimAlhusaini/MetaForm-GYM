import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import {
  fetchWorkoutPlans,
  fetchWorkoutPlanTemplates,
} from '../services/workout-plans.service.js'
import type { WorkoutPlanQuery } from '../types/workout-plans.types.js'
import { cleanPlanQuery } from '../utils/workout-plan-query.js'

export const useWorkoutPlans = (query: WorkoutPlanQuery, templates = false) => {
  const { t } = useTranslation('workoutPlans')
  const load = useCallback(() => {
    const cleaned = cleanPlanQuery(query)
    if (!templates) return fetchWorkoutPlans(cleaned)
    return fetchWorkoutPlanTemplates({
      page: cleaned.page,
      limit: cleaned.limit,
      sortBy: cleaned.sortBy,
      sortOrder: cleaned.sortOrder,
      ...(cleaned.search ? { search: cleaned.search } : {}),
      ...(cleaned.difficultyLevel
        ? { difficultyLevel: cleaned.difficultyLevel }
        : {}),
    })
  }, [query, templates])
  return useAsyncResource(
    load,
    t(templates ? 'errors.templates' : 'errors.list'),
  )
}
