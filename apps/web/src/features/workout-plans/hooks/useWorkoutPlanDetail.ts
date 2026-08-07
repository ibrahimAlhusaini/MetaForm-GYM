import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsyncResource } from '../../weight-tracker/hooks/useAsyncResource.js'
import { fetchWorkoutPlan } from '../services/workout-plans.service.js'

export const useWorkoutPlanDetail = (planId: string) => {
  const { t } = useTranslation('workoutPlans')
  const load = useCallback(() => fetchWorkoutPlan(planId), [planId])
  return useAsyncResource(load, t('errors.detail'))
}
