import type { Prisma } from '../../generated/prisma/client.js'

export const exerciseListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  primaryMuscle: true,
  muscleSubgroup: true,
  secondaryMuscles: true,
  equipmentType: true,
  difficultyLevel: true,
  movementType: true,
  thumbnailUrl: true,
  videoUrl: true,
  recommendedSets: true,
  recommendedReps: true,
} satisfies Prisma.ExerciseSelect

export const exerciseDetailSelect = {
  ...exerciseListSelect,
  instructions: true,
  commonMistakes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ExerciseSelect

export const adminExerciseDetailSelect = {
  ...exerciseDetailSelect,
  isPublished: true,
} satisfies Prisma.ExerciseSelect

export const exerciseOptionSelect = {
  id: true,
  name: true,
  primaryMuscle: true,
  muscleSubgroup: true,
  equipmentType: true,
  thumbnailUrl: true,
} satisfies Prisma.ExerciseSelect

type DetailRow = Prisma.ExerciseGetPayload<{
  select: typeof exerciseDetailSelect
}>
type AdminDetailRow = Prisma.ExerciseGetPayload<{
  select: typeof adminExerciseDetailSelect
}>

export const mapExerciseDetail = (exercise: DetailRow) => ({
  ...exercise,
  createdAt: exercise.createdAt.toISOString(),
  updatedAt: exercise.updatedAt.toISOString(),
})

export const mapAdminExerciseDetail = (exercise: AdminDetailRow) => ({
  ...mapExerciseDetail(exercise),
  isPublished: exercise.isPublished,
})
