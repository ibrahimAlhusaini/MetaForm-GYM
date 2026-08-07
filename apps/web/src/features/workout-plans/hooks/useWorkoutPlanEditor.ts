import type { WorkoutPlanDetail } from '@metaform/shared-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  createPlannedExercise,
  createWorkoutPlanDay,
  deletePlannedExercise,
  deleteWorkoutPlanDay,
  reorderPlannedExercises,
  reorderWorkoutPlanDays,
  updatePlannedExercise,
  updateWorkoutPlan,
  updateWorkoutPlanDay,
} from '../services/workout-plans.service.js'
import type { PlanDayDraft } from '../types/workout-plans.types.js'
import { moveItem } from '../utils/workout-plan-order.js'
import { detailToDraftDays } from '../utils/workout-plan-payload.js'
import {
  createPlanDraftSchema,
  createPlanMetadataSchema,
  type PlanMetadataFormValues,
} from '../validation/workout-plan.schemas.js'
import { useWorkoutPlanMutations } from './useWorkoutPlanMutations.js'

const nullable = (value: string) => (value.trim() ? value.trim() : null)
const optionalNumber = (value: string) => (value.trim() ? Number(value) : null)
const weekdays = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

export const useWorkoutPlanEditor = (initialPlan: WorkoutPlanDetail) => {
  const { t } = useTranslation('workoutPlans')
  const [plan, setPlan] = useState(initialPlan)
  const [days, setDays] = useState(() => detailToDraftDays(initialPlan))
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const mutations = useWorkoutPlanMutations()
  const metadataSchema = useMemo(() => createPlanMetadataSchema(t), [t])
  const daySchema = useMemo(() => createPlanDraftSchema(t), [t])
  const form = useForm<PlanMetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      name: plan.name,
      description: plan.description ?? '',
      difficultyLevel: plan.difficultyLevel,
      isTemplate: plan.isTemplate,
    },
  })
  const accept = (updated: WorkoutPlanDetail | null) => {
    if (!updated) return
    setPlan(updated)
    setDays(detailToDraftDays(updated))
  }
  const run = (
    operation: () => Promise<WorkoutPlanDetail>,
    safeError = t('errors.update'),
  ) => {
    void mutations.run(operation, safeError).then(accept)
  }
  const validateDay = (day: PlanDayDraft): boolean => {
    const result = daySchema.safeParse([day])
    if (result.success) {
      setValidationErrors([])
      return true
    }
    setValidationErrors(result.error.issues.map((issue) => issue.message))
    return false
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
      orderIndex: index,
    }
    if (!day.id) {
      run(() => createWorkoutPlanDay(plan.id, input))
      return
    }
    const original = plan.days.find((item) => item.id === day.id)
    run(async () => {
      if (day.isRestDay && original?.exercises.length)
        for (const exercise of original.exercises)
          await deletePlannedExercise(exercise.id)
      return updateWorkoutPlanDay(day.id ?? '', input)
    })
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
      orderIndex: exerciseIndex,
    }
    run(() =>
      item.id
        ? updatePlannedExercise(item.id, input)
        : createPlannedExercise(day.id ?? '', input),
    )
  }
  const removeDay = (index: number) => {
    const day = days[index]
    if (!day) return
    if (day.id) run(() => deleteWorkoutPlanDay(day.id ?? ''))
    else setDays(days.filter((_, itemIndex) => itemIndex !== index))
  }
  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    const item = days[dayIndex]?.exercises[exerciseIndex]
    if (!item) return
    if (item.id) run(() => deletePlannedExercise(item.id ?? ''))
    else
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
  }
  const moveDay = (index: number, direction: -1 | 1) => {
    const next = moveItem(days, index, index + direction)
    if (next.some((day) => !day.id)) {
      setDays(next)
      return
    }
    run(
      () =>
        reorderWorkoutPlanDays(plan.id, {
          items: next.map((day, orderIndex) => ({
            dayId: day.id ?? '',
            orderIndex,
          })),
        }),
      t('errors.reorder'),
    )
  }
  const moveExercise = (
    dayIndex: number,
    exerciseIndex: number,
    direction: -1 | 1,
  ) => {
    const day = days[dayIndex]
    if (!day?.id) return
    const next = moveItem(
      day.exercises,
      exerciseIndex,
      exerciseIndex + direction,
    )
    if (next.some((item) => !item.id)) {
      setDays(
        days.map((value, index) =>
          index === dayIndex ? { ...value, exercises: next } : value,
        ),
      )
      return
    }
    run(
      () =>
        reorderPlannedExercises(day.id ?? '', {
          items: next.map((item, orderIndex) => ({
            planExerciseId: item.id ?? '',
            orderIndex,
          })),
        }),
      t('errors.reorder'),
    )
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
  return {
    plan,
    days,
    setDays,
    form,
    mutations,
    validationErrors,
    saveMetadata,
    saveDay,
    saveExercise,
    removeDay,
    removeExercise,
    moveDay,
    moveExercise,
    addDay,
  }
}
