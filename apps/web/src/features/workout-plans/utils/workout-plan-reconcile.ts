import type { WorkoutPlanDetail } from '@metaform/shared-types'
import type { PlanDayDraft } from '../types/workout-plans.types.js'
import { detailToDraftDays } from './workout-plan-payload.js'

const confirmedDays = (plan: WorkoutPlanDetail) => detailToDraftDays(plan)

export const reconcileConfirmedDay = (
  current: PlanDayDraft[],
  plan: WorkoutPlanDetail,
  dayIndex: number,
): PlanDayDraft[] => {
  const draft = current[dayIndex]
  if (!draft) return current
  const confirmed = confirmedDays(plan).find((day) =>
    draft.id ? day.id === draft.id : day.dayOfWeek === draft.dayOfWeek,
  )
  if (!confirmed) return current
  return current.map((day, index) =>
    index === dayIndex
      ? { ...confirmed, exercises: confirmed.isRestDay ? [] : day.exercises }
      : day,
  )
}

export const reconcileConfirmedExercise = (
  current: PlanDayDraft[],
  plan: WorkoutPlanDetail,
  dayIndex: number,
  exerciseIndex: number,
  createdOrderIndex?: number,
): PlanDayDraft[] => {
  const day = current[dayIndex]
  const draft = day?.exercises[exerciseIndex]
  if (!day?.id || !draft) return current
  const rawConfirmedDay = plan.days.find((item) => item.id === day.id)
  const confirmedDay = confirmedDays(plan).find((item) => item.id === day.id)
  const confirmedId =
    draft.id ??
    rawConfirmedDay?.exercises.find(
      (item) =>
        item.exercise.id === draft.exercise?.id &&
        item.orderIndex === createdOrderIndex,
    )?.id
  const confirmed = confirmedDay?.exercises.find(
    (item) => item.id === confirmedId,
  )
  if (!confirmed) return current
  return current.map((item, index) =>
    index === dayIndex
      ? {
          ...item,
          exercises: item.exercises.map((exercise, itemIndex) =>
            itemIndex === exerciseIndex ? confirmed : exercise,
          ),
        }
      : item,
  )
}

export const orderDraftDaysByConfirmedPlan = (
  current: PlanDayDraft[],
  plan: WorkoutPlanDetail,
): PlanDayDraft[] =>
  confirmedDays(plan).map(
    (confirmed) => current.find((day) => day.id === confirmed.id) ?? confirmed,
  )

export const orderDraftExercisesByConfirmedPlan = (
  current: PlanDayDraft[],
  plan: WorkoutPlanDetail,
  dayId: string,
): PlanDayDraft[] => {
  const confirmedDay = confirmedDays(plan).find((day) => day.id === dayId)
  if (!confirmedDay) return current
  return current.map((day) =>
    day.id === dayId
      ? {
          ...day,
          exercises: confirmedDay.exercises.map(
            (confirmed) =>
              day.exercises.find((item) => item.id === confirmed.id) ??
              confirmed,
          ),
        }
      : day,
  )
}
