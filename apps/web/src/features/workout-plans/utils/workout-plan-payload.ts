import type {
  CreateWorkoutPlanDayRequest,
  CreateWorkoutPlanRequest,
  WorkoutPlanDetail,
} from '@metaform/shared-types'
import type {
  PlanDayDraft,
  PlanMetadataValues,
} from '../types/workout-plans.types.js'

const nullable = (value: string): string | null =>
  value.trim() ? value.trim() : null
const optionalNumber = (value: string): number | null =>
  value.trim() ? Number(value) : null

export const dayPayload = (
  day: PlanDayDraft,
  orderIndex: number,
): CreateWorkoutPlanDayRequest => ({
  dayOfWeek: day.dayOfWeek,
  name: nullable(day.name),
  notes: nullable(day.notes),
  isRestDay: day.isRestDay,
  orderIndex,
  exercises: day.isRestDay
    ? []
    : day.exercises.map((item, exerciseIndex) => ({
        exerciseId: item.exercise?.id ?? '',
        sets: optionalNumber(item.sets),
        reps: nullable(item.reps),
        restSeconds: optionalNumber(item.restSeconds),
        notes: nullable(item.notes),
        orderIndex: exerciseIndex,
      })),
})

export const createPlanPayload = (
  metadata: PlanMetadataValues,
  days: PlanDayDraft[],
): CreateWorkoutPlanRequest => ({
  name: metadata.name.trim(),
  description: nullable(metadata.description),
  difficultyLevel: metadata.difficultyLevel,
  isTemplate: metadata.isTemplate,
  days: days.map(dayPayload),
})

export const detailToDraftDays = (plan: WorkoutPlanDetail): PlanDayDraft[] =>
  [...plan.days]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((day) => ({
      id: day.id,
      dayOfWeek: day.dayOfWeek,
      name: day.name ?? '',
      notes: day.notes ?? '',
      isRestDay: day.isRestDay,
      exercises: [...day.exercises]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item) => ({
          id: item.id,
          exercise: item.exercise,
          sets: item.sets?.toString() ?? '',
          reps: item.reps ?? '',
          restSeconds: item.restSeconds?.toString() ?? '',
          notes: item.notes ?? '',
        })),
    }))
