import { prisma } from '../../config/prisma.js'
import { AppError } from '../../utils/app-error.js'
import { paginationMetadata, paginationSkip } from '../../utils/pagination.js'
import {
  EXERCISE_FILTER_OPTIONS,
  EXERCISE_NOT_FOUND,
} from './exercise-library.constants.js'
import {
  exerciseDetailSelect,
  exerciseListSelect,
  exerciseOptionSelect,
  mapExerciseDetail,
} from './exercise-library.mapper.js'
import {
  exerciseOptionsWhere,
  exerciseOrderBy,
  publicExerciseWhere,
} from './exercise-library.query.js'
import type {
  ExerciseOptionsQuery,
  PublicExerciseListQuery,
} from './exercise-library.validation.js'

const notFound = (): never => {
  throw new AppError(404, EXERCISE_NOT_FOUND)
}

export const listPublishedExercises = async (
  query: PublicExerciseListQuery,
) => {
  const where = publicExerciseWhere(query)
  const [totalItems, items] = await prisma.$transaction([
    prisma.exercise.count({ where }),
    prisma.exercise.findMany({
      where,
      select: exerciseListSelect,
      orderBy: exerciseOrderBy(query.sortBy, query.sortOrder),
      skip: paginationSkip(query),
      take: query.limit,
    }),
  ])
  return { items, pagination: paginationMetadata(query, totalItems) }
}

export const getPublishedExerciseById = async (exerciseId: string) => {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, isPublished: true },
    select: exerciseDetailSelect,
  })
  return exercise ? mapExerciseDetail(exercise) : notFound()
}

export const getPublishedExerciseBySlug = async (slug: string) => {
  const exercise = await prisma.exercise.findFirst({
    where: { slug, isPublished: true },
    select: exerciseDetailSelect,
  })
  return exercise ? mapExerciseDetail(exercise) : notFound()
}

export const listExerciseOptions = async (query: ExerciseOptionsQuery) => ({
  items: await prisma.exercise.findMany({
    where: exerciseOptionsWhere(query),
    select: exerciseOptionSelect,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take: query.limit,
  }),
})

export const getExerciseFilterOptions = () => EXERCISE_FILTER_OPTIONS
