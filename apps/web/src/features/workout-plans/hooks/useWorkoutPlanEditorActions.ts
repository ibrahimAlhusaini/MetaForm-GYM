import type { WorkoutPlanDetail } from '@metaform/shared-types'
import type { TFunction } from 'i18next'
import type { Dispatch, SetStateAction } from 'react'
import {
  createPlannedExercise,
  createWorkoutPlanDay,
  deletePlannedExercise,
  deleteWorkoutPlanDay,
  fetchWorkoutPlan,
  updatePlannedExercise,
  updateWorkoutPlan,
  updateWorkoutPlanDay,
} from '../services/workout-plans.service.js'
import type { PlanDayDraft } from '../types/workout-plans.types.js'
import { nextOrderIndex } from '../utils/workout-plan-order.js'
import { detailToDraftDays } from '../utils/workout-plan-payload.js'
import {
  reconcileConfirmedDay,
  reconcileConfirmedExercise,
} from '../utils/workout-plan-reconcile.js'
import type { PlanMetadataFormValues } from '../validation/workout-plan.schemas.js'
import type { useWorkoutPlanMutations } from './useWorkoutPlanMutations.js'
import { useWorkoutPlanOrderingActions } from './useWorkoutPlanOrderingActions.js'

const nullable = (value: string) => (value.trim() ? value.trim() : null)
const optionalNumber = (value: string) => (value.trim() ? Number(value) : null)
interface EditorActionsOptions {
  plan: WorkoutPlanDetail
  days: PlanDayDraft[]
  setPlan: Dispatch<SetStateAction<WorkoutPlanDetail>>
  setDays: Dispatch<SetStateAction<PlanDayDraft[]>>
  validateDay: (day: PlanDayDraft) => boolean
  mutations: ReturnType<typeof useWorkoutPlanMutations>
  t: TFunction
}

export const useWorkoutPlanEditorActions = ({
  plan,
  days,
  setPlan,
  setDays,
  validateDay,
  mutations,
  t,
}: EditorActionsOptions) => {
  const ordering = useWorkoutPlanOrderingActions({
    plan,
    days,
    setPlan,
    setDays,
    mutations,
    t,
  })
  const acceptAll = (updated: WorkoutPlanDetail) => {
    setPlan(updated)
    setDays(detailToDraftDays(updated))
  }
  const run = (
    operation: () => Promise<WorkoutPlanDetail>,
    safeError = t('errors.update'),
    onAccept: (updated: WorkoutPlanDetail) => void = setPlan,
  ) => {
    void mutations.run(operation, safeError).then((updated) => {
      if (updated) onAccept(updated)
    })
  }
  const saveMetadata = (values: PlanMetadataFormValues) => {
    run(() =>
      updateWorkoutPlan(plan.id, {
        name: values.name.trim(),
        description: nullable(values.description),
        difficultyLevel: values.difficultyLevel,
        isTemplate: values.isTemplate,
      }),
    )
  }
  const saveDay = (index: number) => {
    const day = days[index]
    if (!day || !validateDay(day)) return
    const input = {
      dayOfWeek: day.dayOfWeek,
      name: nullable(day.name),
      notes: nullable(day.notes),
      isRestDay: day.isRestDay,
    }
    const reconcile = (updated: WorkoutPlanDetail) => {
      setPlan(updated)
      setDays((current) => reconcileConfirmedDay(current, updated, index))
    }
    if (!day.id) {
      run(
        () =>
          createWorkoutPlanDay(plan.id, {
            ...input,
            orderIndex: nextOrderIndex(plan.days),
          }),
        t('errors.update'),
        reconcile,
      )
      return
    }
    const original = plan.days.find((item) => item.id === day.id)
    run(
      async () => {
        try {
          if (day.isRestDay && original?.exercises.length)
            for (const exercise of original.exercises)
              await deletePlannedExercise(exercise.id)
          return await updateWorkoutPlanDay(day.id ?? '', input)
        } catch (reason) {
          try {
            acceptAll(await fetchWorkoutPlan(plan.id))
          } catch {
            // The original safe mutation error remains visible if resync fails.
          }
          throw reason
        }
      },
      t('errors.update'),
      reconcile,
    )
  }
  const saveExercise = (dayIndex: number, exerciseIndex: number) => {
    const day = days[dayIndex]
    const item = day?.exercises[exerciseIndex]
    if (!day?.id || !item || !validateDay(day) || !item.exercise) return
    const input = {
      exerciseId: item.exercise.id,
      sets: optionalNumber(item.sets),
      reps: nullable(item.reps),
      restSeconds: optionalNumber(item.restSeconds),
      notes: nullable(item.notes),
    }
    const createdOrderIndex = nextOrderIndex(
      plan.days.find((value) => value.id === day.id)?.exercises ?? [],
    )
    run(
      () =>
        item.id
          ? updatePlannedExercise(item.id, input)
          : createPlannedExercise(day.id ?? '', {
              ...input,
              orderIndex: createdOrderIndex,
            }),
      t('errors.update'),
      (updated) => {
        setPlan(updated)
        setDays((current) =>
          reconcileConfirmedExercise(
            current,
            updated,
            dayIndex,
            exerciseIndex,
            item.id ? undefined : createdOrderIndex,
          ),
        )
      },
    )
  }
  const removeDay = (index: number) => {
    const day = days[index]
    if (!day) return
    if (!day.id) {
      setDays(days.filter((_, itemIndex) => itemIndex !== index))
      return
    }
    run(
      () => deleteWorkoutPlanDay(day.id ?? ''),
      t('errors.update'),
      (updated) => {
        setPlan(updated)
        setDays((current) => current.filter((item) => item.id !== day.id))
      },
    )
  }
  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    const item = days[dayIndex]?.exercises[exerciseIndex]
    if (!item) return
    if (!item.id) {
      setDays(
        days.map((day, index) =>
          index === dayIndex
            ? {
                ...day,
                exercises: day.exercises.filter(
                  (_, itemIndex) => itemIndex !== exerciseIndex,
                ),
              }
            : day,
        ),
      )
      return
    }
    run(
      () => deletePlannedExercise(item.id ?? ''),
      t('errors.update'),
      (updated) => {
        setPlan(updated)
        setDays((current) =>
          current.map((day, index) =>
            index === dayIndex
              ? {
                  ...day,
                  exercises: day.exercises.filter(
                    (exercise) => exercise.id !== item.id,
                  ),
                }
              : day,
          ),
        )
      },
    )
  }
  return {
    saveMetadata,
    saveDay,
    saveExercise,
    removeDay,
    removeExercise,
    ...ordering,
  }
}
