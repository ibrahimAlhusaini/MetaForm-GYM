export const WORKOUT_PLAN_LIMITS = {
  defaultPageSize: 12,
  maximumPageSize: 50,
  search: 120,
  name: 120,
  description: 2_000,
  notes: 2_000,
  reps: 80,
  dayName: 120,
  maximumDays: 14,
  maximumExercisesPerDay: 50,
  maximumSets: 100,
  maximumRestSeconds: 86_400,
} as const

export const WORKOUT_PLAN_NOT_FOUND = 'Workout plan not found'
export const WORKOUT_PLAN_CONFLICT =
  'Workout plan ordering or weekly structure conflicts with existing data'
export const REORDER_TEMPORARY_OFFSET = 1_000
