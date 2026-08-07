import type { WorkoutPlanDetail } from '@metaform/shared-types'
import type { TFunction } from 'i18next'
import type { Dispatch, SetStateAction } from 'react'
import {
  reorderPlannedExercises,
  reorderWorkoutPlanDays,
} from '../services/workout-plans.service.js'
import type { PlanDayDraft } from '../types/workout-plans.types.js'
import { moveItem } from '../utils/workout-plan-order.js'
import {
  orderDraftDaysByConfirmedPlan,
  orderDraftExercisesByConfirmedPlan,
} from '../utils/workout-plan-reconcile.js'
import type { useWorkoutPlanMutations } from './useWorkoutPlanMutations.js'

const weekdays = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

interface OrderingActionsOptions {
  plan: WorkoutPlanDetail
  days: PlanDayDraft[]
  setPlan: Dispatch<SetStateAction<WorkoutPlanDetail>>
  setDays: Dispatch<SetStateAction<PlanDayDraft[]>>
  mutations: ReturnType<typeof useWorkoutPlanMutations>
  t: TFunction
}

export const useWorkoutPlanOrderingActions = ({
  plan,
  days,
  setPlan,
  setDays,
  mutations,
  t,
}: OrderingActionsOptions) => {
  const moveDay = (index: number, direction: -1 | 1) => {
    if (days.some((day) => !day.id)) return
    const next = moveItem(days, index, index + direction)
    void mutations
      .run(
        () =>
          reorderWorkoutPlanDays(plan.id, {
            items: next.map((day, orderIndex) => ({
              dayId: day.id ?? '',
              orderIndex,
            })),
          }),
        t('errors.reorder'),
      )
      .then((updated) => {
        if (!updated) return
        setPlan(updated)
        setDays((current) => orderDraftDaysByConfirmedPlan(current, updated))
      })
  }
  const moveExercise = (
    dayIndex: number,
    exerciseIndex: number,
    direction: -1 | 1,
  ) => {
    const day = days[dayIndex]
    if (!day?.id || day.exercises.some((item) => !item.id)) return
    const next = moveItem(
      day.exercises,
      exerciseIndex,
      exerciseIndex + direction,
    )
    void mutations
      .run(
        () =>
          reorderPlannedExercises(day.id ?? '', {
            items: next.map((item, orderIndex) => ({
              planExerciseId: item.id ?? '',
              orderIndex,
            })),
          }),
        t('errors.reorder'),
      )
      .then((updated) => {
        if (!updated) return
        setPlan(updated)
        setDays((current) =>
          orderDraftExercisesByConfirmedPlan(current, updated, day.id ?? ''),
        )
      })
  }
  const addDay = () => {
    const next = weekdays.find(
      (weekday) => !days.some((day) => day.dayOfWeek === weekday),
    )
    if (next)
      setDays([
        ...days,
        {
          dayOfWeek: next,
          name: '',
          notes: '',
          isRestDay: false,
          exercises: [],
        },
      ])
  }
  return { moveDay, moveExercise, addDay }
}
