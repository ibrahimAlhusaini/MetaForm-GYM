import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchWorkoutPlan } from '../../workout-plans/services/workout-plans.service.js'
import type { EntryDraft } from '../types/weight-tracker.types.js'
import { emptySetDraft } from '../utils/payload-transformers.js'
import { useAsyncResource } from './useAsyncResource.js'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface WorkoutPlanPrefill {
  workoutPlanId: string
  planName: string
  dayName: string
  entries: EntryDraft[]
}

export const useWorkoutPlanPrefill = (
  workoutPlanId: string | null,
  planDayId: string | null,
) => {
  const { t } = useTranslation(['weightTracker', 'workoutPlans', 'common'])
  const load = useCallback(async (): Promise<WorkoutPlanPrefill | null> => {
    if (!workoutPlanId) return null
    if (
      !uuidPattern.test(workoutPlanId) ||
      (planDayId && !uuidPattern.test(planDayId))
    )
      throw new Error('invalid plan selection')
    const plan = await fetchWorkoutPlan(workoutPlanId)
    const trainingDays = plan.days.filter((day) => !day.isRestDay)
    const day = planDayId
      ? trainingDays.find((item) => item.id === planDayId)
      : trainingDays.length === 1
        ? trainingDays[0]
        : undefined
    if (!day) throw new Error('training day unavailable')
    const entries = [...day.exercises]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map<EntryDraft>((item) => {
        const numericReps =
          item.reps && /^\d+$/.test(item.reps) ? item.reps : ''
        const guidance = t('weightTracker:builder.planGuidance', {
          sets: item.sets ?? t('common:states.notSpecified'),
          reps: item.reps ?? t('common:states.notSpecified'),
          rest: item.restSeconds ?? t('common:states.notSpecified'),
        })
        return {
          sourceType: 'exercise',
          exerciseId: item.exercise.id,
          customMachineId: '',
          notes: [item.notes, guidance].filter(Boolean).join('\n'),
          sets: Array.from({ length: item.sets ?? 1 }, (_, index) => ({
            ...emptySetDraft(index + 1),
            reps: numericReps,
          })),
        }
      })
    return {
      workoutPlanId: plan.id,
      planName: plan.name,
      dayName: day.name ?? t(`common:enums.dayOfWeek.${day.dayOfWeek}`),
      entries,
    }
  }, [planDayId, t, workoutPlanId])
  return useAsyncResource(load, t('workoutPlans:errors.prefill'))
}
