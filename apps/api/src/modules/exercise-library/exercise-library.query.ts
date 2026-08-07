import type { Prisma } from '../../generated/prisma/client.js'
import type {
  AdminExerciseListQuery,
  ExerciseOptionsQuery,
  PublicExerciseListQuery,
} from './exercise-library.validation.js'

type FilterQuery = Pick<
  AdminExerciseListQuery,
  | 'search'
  | 'primaryMuscle'
  | 'muscleSubgroup'
  | 'secondaryMuscle'
  | 'equipmentType'
  | 'difficultyLevel'
  | 'movementType'
>

export const exerciseFilterWhere = (
  query: FilterQuery,
): Prisma.ExerciseWhereInput => ({
  ...(query.search
    ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {}),
  ...(query.primaryMuscle ? { primaryMuscle: query.primaryMuscle } : {}),
  ...(query.muscleSubgroup ? { muscleSubgroup: query.muscleSubgroup } : {}),
  ...(query.secondaryMuscle
    ? { secondaryMuscles: { has: query.secondaryMuscle } }
    : {}),
  ...(query.equipmentType ? { equipmentType: query.equipmentType } : {}),
  ...(query.difficultyLevel ? { difficultyLevel: query.difficultyLevel } : {}),
  ...(query.movementType ? { movementType: query.movementType } : {}),
})

export const publicExerciseWhere = (
  query: PublicExerciseListQuery,
): Prisma.ExerciseWhereInput => ({
  ...exerciseFilterWhere(query),
  isPublished: true,
})

export const adminExerciseWhere = (
  query: AdminExerciseListQuery,
): Prisma.ExerciseWhereInput => ({
  ...exerciseFilterWhere(query),
  ...(query.isPublished === undefined
    ? {}
    : { isPublished: query.isPublished }),
})

export const exerciseOptionsWhere = (
  query: ExerciseOptionsQuery,
): Prisma.ExerciseWhereInput => ({
  isPublished: true,
  ...(query.search
    ? { name: { contains: query.search, mode: 'insensitive' } }
    : {}),
  ...(query.primaryMuscle ? { primaryMuscle: query.primaryMuscle } : {}),
  ...(query.muscleSubgroup ? { muscleSubgroup: query.muscleSubgroup } : {}),
})

export const exerciseOrderBy = (
  sortBy: 'name' | 'createdAt' | 'updatedAt',
  sortOrder: 'asc' | 'desc',
): Prisma.ExerciseOrderByWithRelationInput[] => {
  const primary =
    sortBy === 'name'
      ? { name: sortOrder }
      : sortBy === 'createdAt'
        ? { createdAt: sortOrder }
        : { updatedAt: sortOrder }
  return [primary, { id: 'asc' }]
}
